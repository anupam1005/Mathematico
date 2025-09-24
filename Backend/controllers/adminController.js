// controllers/adminController.js
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool } = require('../database'); // ensure this exports mysql2/promise pool

// Create upload directories if not exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir(path.join(__dirname, '..', 'uploads', 'pdfs'));
ensureDir(path.join(__dirname, '..', 'uploads', 'covers'));

// multer storage config that writes to different directories based on fieldname
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'pdf') {
      cb(null, path.join(__dirname, '..', 'uploads', 'pdfs'));
    } else if (file.fieldname === 'coverImage') {
      cb(null, path.join(__dirname, '..', 'uploads', 'covers'));
    } else {
      cb(null, path.join(__dirname, '..', 'uploads'));
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Export a middleware used in the route to accept both files:
const uploadFilesForBook = upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

/**
 * GET /api/v1/admin/books
 */
const getBooks = async (req, res) => {
  try {
    // If you use DB:
    if (pool) {
      const [rows] = await pool.execute('SELECT id, title, author, description, category, pages, isbn, status FROM books ORDER BY id DESC');
      return res.json({ success: true, data: rows, message: 'Admin books retrieved successfully' });
    }
    // fallback demo:
    return res.json({ success: true, data: [], message: 'Admin books retrieved successfully (no DB)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to retrieve books', error: err.message });
  }
};

/**
 * GET /api/v1/admin/books/:id
 */
const getBookById = async (req, res) => {
  try {
    const id = req.params.id;
    if (pool) {
      const [rows] = await pool.execute('SELECT * FROM books WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Book not found' });
      return res.json({ success: true, data: rows[0] });
    }
    return res.status(404).json({ success: false, message: 'Book not found (no DB)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to retrieve book', error: err.message });
  }
};

/**
 * POST /api/v1/admin/books
 * Accepts multipart/form-data with fields like title, author and file fields pdf & coverImage
 */
const createBook = async (req, res) => {
  try {
    // For multipart form, text fields are in req.body and uploaded files in req.files
    const {
      title, author, description, category, pages, isbn, status = 'draft'
    } = req.body;

    if (!title || !author || !description || !category) {
      return res.status(400).json({ success: false, message: 'Title, author, description and category are required' });
    }

    // require files
    if (!req.files || !req.files.pdf || !req.files.coverImage) {
      return res.status(400).json({ success: false, message: 'PDF file and cover image are required' });
    }

    const pdfFile = req.files.pdf[0];
    const coverFile = req.files.coverImage[0];

    // Build DB insert. Make sure your DB columns match these names.
    const pdfUrl = `/uploads/pdfs/${path.basename(pdfFile.path)}`;
    const coverImageUrl = `/uploads/covers/${path.basename(coverFile.path)}`;

    if (pool) {
      const insertQuery = `INSERT INTO books (title, author, description, category, pages, isbn, cover_image_url, pdf_url, status, is_published, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
      const [result] = await pool.execute(insertQuery, [
        title,
        author,
        description,
        category,
        pages ? parseInt(pages, 10) : null,
        isbn || null,
        coverImageUrl,
        pdfUrl,
        status,
        status === 'published' ? 1 : 0
      ]);
      const [rows] = await pool.execute('SELECT * FROM books WHERE id = ?', [result.insertId]);
      return res.status(201).json({ success: true, data: rows[0], message: 'Book created successfully' });
    } else {
      // If DB not present, return the created object
      const newBook = {
        id: Date.now(),
        title, author, description, category, pages, isbn,
        coverImage: coverImageUrl, pdfUrl, status, isPublished: status === 'published',
        createdAt: new Date().toISOString()
      };
      return res.status(201).json({ success: true, data: newBook, message: 'Book created (in-memory) successfully' });
    }
  } catch (err) {
    console.error('Error creating book:', err);
    res.status(500).json({ success: false, message: 'Failed to create book', error: err.message });
  }
};

/**
 * PUT /api/v1/admin/books/:id
 */
const updateBook = async (req, res) => {
  try {
    const id = req.params.id;
    const fields = req.body;
    // Build dynamic query safely (example)
    if (pool) {
      const updates = [];
      const values = [];
      for (const key of ['title','author','description','category','pages','isbn','status']) {
        if (fields[key] !== undefined && fields[key] !== null) {
          updates.push(`${key} = ?`);
          values.push(fields[key]);
        }
      }
      if (fields.status !== undefined) {
        updates.push('is_published = ?');
        values.push(fields.status === 'published' ? 1 : 0);
      }
      if (updates.length === 0) return res.json({ success: true, message: 'Nothing to update' });
      values.push(id);
      const query = `UPDATE books SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
      await pool.execute(query, values);
      const [rows] = await pool.execute('SELECT * FROM books WHERE id = ?', [id]);
      return res.json({ success: true, data: rows[0], message: 'Book updated successfully' });
    }
    return res.status(404).json({ success: false, message: 'DB not available' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update book', error: err.message });
  }
};

const deleteBook = async (req, res) => {
  try {
    const id = req.params.id;
    if (pool) {
      await pool.execute('DELETE FROM books WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Book deleted successfully' });
    }
    return res.json({ success: true, message: 'Book deleted (no DB)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete book', error: err.message });
  }
};

const updateBookStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { isPublished } = req.body;
    if (pool) {
      await pool.execute('UPDATE books SET is_published = ?, status = ? WHERE id = ?', [isPublished ? 1 : 0, isPublished ? 'active' : 'draft', id]);
      const [rows] = await pool.execute('SELECT * FROM books WHERE id = ?', [id]);
      return res.json({ success: true, data: rows[0], message: 'Book status updated' });
    }
    res.json({ success: true, message: 'Book status updated (no DB)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update book status', error: err.message });
  }
};

/**
 * COURSES - simple JSON endpoints
 */
const getCourses = async (req, res) => {
  try {
    if (pool) {
      const [rows] = await pool.execute('SELECT id, title, description, category, level, price, status FROM courses ORDER BY id DESC');
      return res.json({ success: true, data: rows, message: 'Admin courses retrieved successfully' });
    }
    return res.json({ success: true, data: [], message: 'Admin courses (no DB)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get courses', error: err.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description, category, level, price, status = 'draft' } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description required' });
    if (pool) {
      const [result] = await pool.execute('INSERT INTO courses (title, description, category, level, price, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())', [title, description, category, level, price || 0, status]);
      return res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Course created successfully' });
    }
    return res.status(201).json({ success: true, data: { id: Date.now() }, message: 'Course created (no DB)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create course', error: err.message });
  }
};

const getCourseById = async (req, res) => {
  try {
    const id = req.params.id;
    if (pool) {
      const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Course not found' });
      return res.json({ success: true, data: rows[0] });
    }
    return res.status(404).json({ success: false, message: 'Course not found (no DB)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get course', error: err.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    // similar to updateBook - omitted for brevity
    return res.json({ success: true, message: 'Course updated (stub)' });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Failed to update course', error: err.message });
  }
};

const deleteCourse = async (req, res) => {
  try { return res.json({ success: true, message: 'Course deleted (stub)' }); } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to delete course' }); }
};

const updateCourseStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { isPublished } = req.body;
    if (pool) {
      await pool.execute('UPDATE courses SET is_published = ?, status = ? WHERE id = ?', [isPublished ? 1 : 0, isPublished ? 'active' : 'draft', id]);
      const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [id]);
      return res.json({ success: true, data: rows[0], message: 'Course status updated' });
    }
    res.json({ success: true, message: 'Course status updated (no DB)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update course status', error: err.message });
  }
};

/**
 * LIVE CLASSES - JSON endpoints (no files)
 */
const getLiveClasses = async (req, res) => {
  try {
    if (pool) {
      const [rows] = await pool.execute('SELECT id, title, description, category, scheduled_at AS scheduledAt, duration, max_students AS maxStudents, status FROM live_classes ORDER BY scheduled_at DESC');
      return res.json({ success: true, data: rows, message: 'Admin live classes retrieved successfully' });
    }
    return res.json({ success: true, data: [], message: 'Live classes (no DB)' });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Failed to get live classes', error: err.message });
  }
};

const createLiveClass = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.scheduledAt) return res.status(400).json({ success: false, message: 'Title and scheduledAt required' });
    if (pool) {
      const [result] = await pool.execute('INSERT INTO live_classes (id, title, description, category, duration, max_students, price, scheduled_at, meeting_url, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())', [
        // generate uuid manually or let DB generate - example uses timestamp-based id for brevity
        (Date.now()).toString(),
        payload.title,
        payload.description || null,
        payload.category || null,
        payload.duration ? parseInt(payload.duration, 10) : 60,
        payload.maxStudents ? parseInt(payload.maxStudents, 10) : 50,
        payload.price || 0,
        payload.scheduledAt,
        payload.meetingUrl || null,
        payload.status || 'scheduled'
      ]);
      return res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Live class created' });
    }
    return res.status(201).json({ success: true, data: { id: Date.now().toString() }, message: 'Live class created (no DB)' });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Failed to create live class', error: err.message });
  }
};

const getLiveClassById = async (req, res) => { res.json({ success: true, data: null, message: 'Get live class (stub)' }); };
const updateLiveClass = async (req, res) => { res.json({ success: true, message: 'Update live class (stub)' }); };
const deleteLiveClass = async (req, res) => { res.json({ success: true, message: 'Delete live class (stub)' }); };
const updateLiveClassStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { isPublished } = req.body;
    if (pool) {
      await pool.execute('UPDATE live_classes SET is_published = ?, status = ? WHERE id = ?', [isPublished ? 1 : 0, isPublished ? 'scheduled' : 'draft', id]);
      const [rows] = await pool.execute('SELECT * FROM live_classes WHERE id = ?', [id]);
      return res.json({ success: true, data: rows[0], message: 'Live class status updated' });
    }
    res.json({ success: true, message: 'Live class status updated (no DB)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update live class status', error: err.message });
  }
};

// USERS (paging example)
const getUsers = async (req, res) => {
  try {
    if (pool) {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const offset = (page - 1) * limit;
      const [rows] = await pool.execute('SELECT id, name, email, role FROM users ORDER BY id DESC');
      return res.json({ success: true, data: rows });
    }
    return res.json({ success: true, data: [] });
  } catch (err) {
    console.error(err); 
    res.status(500).json({ success: false, message: 'Failed to get users', error: err.message });
  }
};

// DASHBOARD STATS
const getDashboardStats = async (req, res) => {
  try {
    if (pool) {
      // Get total counts
      const [usersResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
      const [coursesResult] = await pool.execute('SELECT COUNT(*) as total FROM courses');
      const [booksResult] = await pool.execute('SELECT COUNT(*) as total FROM books');
      const [liveClassesResult] = await pool.execute('SELECT COUNT(*) as total FROM live_classes');
      
      // Get recent activity (last 7 days) - simplified for now
      const [recentUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
      const [recentCourses] = await pool.execute('SELECT COUNT(*) as count FROM courses');
      
      const stats = {
        totalUsers: usersResult[0].total,
        totalCourses: coursesResult[0].total,
        totalBooks: booksResult[0].total,
        totalLiveClasses: liveClassesResult[0].total,
        recentUsers: recentUsers[0].count,
        recentCourses: recentCourses[0].count,
        lastUpdated: new Date().toISOString()
      };
      
      return res.json({ success: true, data: stats, message: 'Dashboard stats retrieved successfully' });
    }
    
    // Fallback data if no database
    const fallbackStats = {
      totalUsers: 0,
      totalCourses: 0,
      totalBooks: 0,
      totalLiveClasses: 0,
      recentUsers: 0,
      recentCourses: 0,
      lastUpdated: new Date().toISOString()
    };
    
    return res.json({ success: true, data: fallbackStats, message: 'Dashboard stats retrieved (no DB)' });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to get dashboard stats', error: err.message });
  }
};

module.exports = {
  uploadFilesForBook,
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateBookStatus,

  getCourses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  updateCourseStatus,

  getLiveClasses,
  createLiveClass,
  getLiveClassById,
  updateLiveClass,
  deleteLiveClass,
  updateLiveClassStatus,

  getUsers,
  getDashboardStats,
};
