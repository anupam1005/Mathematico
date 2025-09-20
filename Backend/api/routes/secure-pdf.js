const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireUser } = require('../../middlewares/auth');

const router = express.Router();

// Serve the secure PDF viewer
router.get('/viewer', (req, res) => {
  const viewerPath = path.join(__dirname, '../secure-pdf-viewer.html');
  res.sendFile(viewerPath);
});

// Secure PDF serving endpoint (requires authentication)
router.get('/pdf/:bookId', authenticateToken, requireUser, async (req, res) => {
  try {
    const { bookId } = req.params;
    
    // Get book information from database
    const { pool } = require('../../database');
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT id, title, pdfUrl, status, isPublished FROM books WHERE id = ? AND status = "published" AND isPublished = TRUE',
      [bookId]
    );
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found or not available'
      });
    }
    
    const book = rows[0];
    const pdfPath = path.join(__dirname, '../../', book.pdfUrl);
    
    // Check if PDF file exists
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }
    
    // Set security headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + book.title + '.pdf"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
    
    // Disable caching to prevent local storage
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Stream the PDF file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving PDF file'
    });
  }
});

// Get PDF viewer URL (for frontend integration)
router.get('/viewer-url/:bookId', authenticateToken, requireUser, async (req, res) => {
  try {
    const { bookId } = req.params;
    
    // Get book information
    const { pool } = require('../../database');
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT id, title FROM books WHERE id = ? AND status = "published" AND isPublished = TRUE',
      [bookId]
    );
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found or not available'
      });
    }
    
    const book = rows[0];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pdfUrl = `${baseUrl}/api/secure-pdf/pdf/${bookId}`;
    const viewerUrl = `${baseUrl}/api/secure-pdf/viewer?url=${encodeURIComponent(pdfUrl)}&title=${encodeURIComponent(book.title)}`;
    
    res.json({
      success: true,
      data: {
        viewerUrl,
        pdfUrl,
        bookTitle: book.title
      }
    });
    
  } catch (error) {
    console.error('Error generating viewer URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating viewer URL'
    });
  }
});

// Get book cover image
router.get('/cover/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    
    // Get book cover information
    const { pool } = require('../../database');
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT cover_image FROM books WHERE id = ? AND status = "published" AND isPublished = TRUE',
      [bookId]
    );
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book cover not found'
      });
    }
    
    const book = rows[0];
    const coverPath = path.join(__dirname, '../../', book.cover_image);
    
    // Check if cover image exists
    if (!fs.existsSync(coverPath)) {
      // Return default placeholder
      const placeholderPath = path.join(__dirname, '../../public/placeholder.svg');
      return res.sendFile(placeholderPath);
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Stream the cover image
    const fileStream = fs.createReadStream(coverPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving cover image:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving cover image'
    });
  }
});

module.exports = router;
