import { Request, Response } from 'express';
import { Book } from '../entities/Book';
import { AppDataSource } from '../config/data-source';
import { sendResponse } from '../utils/apiResponse';
import { validateBookData } from '../utils/validation';

// Debug imports
console.log('Book entity imported:', Book);
console.log('AppDataSource imported:', AppDataSource);

// Extend Express Request interface to include files
declare global {
  namespace Express {
    interface Request {
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
    }
  }
}

const bookRepository = AppDataSource.getRepository(Book);
console.log('Book repository created:', bookRepository);

export class BookController {
  // Get all published books (for students)
  static async getPublishedBooks(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, category, subject, level, search } = req.query;
      
      const queryBuilder = bookRepository
        .createQueryBuilder('book')
        .leftJoinAndSelect('book.creator', 'creator')
        .where('book.isPublished = :isPublished', { isPublished: true })
        .andWhere('book.status = :status', { status: 'active' });

      // Apply filters
      if (category) {
        queryBuilder.andWhere('book.category = :category', { category });
      }
      if (subject) {
        queryBuilder.andWhere('book.subject = :subject', { subject });
      }
      if (level) {
        queryBuilder.andWhere('book.level = :level', { level });
      }
      if (search) {
        queryBuilder.andWhere(
          '(book.title LIKE :search OR book.description LIKE :search OR book.author LIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      const [books, total] = await queryBuilder
        .skip(skip)
        .take(Number(limit))
        .orderBy('book.createdAt', 'DESC')
        .getManyAndCount();

      const totalPages = Math.ceil(total / Number(limit));

      return sendResponse(res, 200, {
        books,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages
        }
      }, 'Books retrieved successfully');
    } catch (error) {
      console.error('Error fetching published books:', error);
      return sendResponse(res, 500, null, 'Failed to fetch books');
    }
  }

  // Get book by ID (for students)
  static async getBookById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const book = await bookRepository.findOne({
        where: { id, isPublished: true, status: 'active' },
        relations: ['creator']
      });

      if (!book) {
        return sendResponse(res, 404, null, 'Book not found');
      }

      // Increment download count
      book.downloads += 1;
      await bookRepository.save(book);

      return sendResponse(res, 200, { book }, 'Book retrieved successfully');
    } catch (error) {
      console.error('Error fetching book:', error);
      return sendResponse(res, 500, null, 'Failed to fetch book');
    }
  }

  // Download PDF file
  static async downloadPdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const book = await bookRepository.findOne({
        where: { id, isPublished: true, status: 'active' }
      });

      if (!book) {
        sendResponse(res, 404, null, 'Book not found');
        return;
      }

      if (!book.pdfUrl) {
        sendResponse(res, 404, null, 'PDF file not available for this book');
        return;
      }

      // Construct the full file path
      const path = require('path');
      const fs = require('fs');
      const filePath = path.join(process.cwd(), book.pdfUrl);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error('PDF file not found at path:', filePath);
        sendResponse(res, 404, null, 'PDF file not found on server');
        return;
      }

      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${book.title}.pdf"`);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error: any) => {
        console.error('Error streaming PDF file:', error);
        if (!res.headersSent) {
          sendResponse(res, 500, null, 'Error reading PDF file');
        }
      });

    } catch (error) {
      console.error('Error downloading PDF:', error);
      sendResponse(res, 500, null, 'Failed to download PDF');
    }
  }

  // Get all books (admin only)
  static async getAllBooks(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, category, search } = req.query;
      
      console.log('Admin getAllBooks called with:', { page, limit, status, category, search });
      
      const queryBuilder = bookRepository
        .createQueryBuilder('book')
        .leftJoinAndSelect('book.creator', 'creator');

      // Apply filters - only filter by status if explicitly specified
      if (status && status !== 'all') {
        queryBuilder.andWhere('book.status = :status', { status });
        console.log('Applied status filter:', status);
      }
      if (category && category !== 'all') {
        queryBuilder.andWhere('book.category = :category', { category });
        console.log('Applied category filter:', category);
      }
      if (search) {
        queryBuilder.andWhere(
          '(book.title LIKE :search OR book.description LIKE :search OR book.author LIKE :search)',
          { search: `%${search}%` }
        );
        console.log('Applied search filter:', search);
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      console.log('Pagination:', { skip, take: Number(limit) });
      
      const [books, total] = await queryBuilder
        .skip(skip)
        .take(Number(limit))
        .orderBy('book.createdAt', 'DESC')
        .getManyAndCount();

      console.log(`Found ${books.length} books out of ${total} total`);

      const totalPages = Math.ceil(total / Number(limit));

      return sendResponse(res, 200, {
        books,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages
        }
      }, 'Books retrieved successfully');
    } catch (error) {
      console.error('Error fetching all books:', error);
      return sendResponse(res, 500, null, 'Failed to fetch books');
    }
  }

  // Get book by ID (admin version)
  static async getBookByIdAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const book = await bookRepository.findOne({
        where: { id },
        relations: ['creator']
      });

      if (!book) {
        return sendResponse(res, 404, null, 'Book not found');
      }

      return sendResponse(res, 200, { book }, 'Book retrieved successfully');
    } catch (error) {
      console.error('Error fetching book:', error);
      return sendResponse(res, 500, null, 'Failed to fetch book');
    }
  }

  // Create new book (admin only)
  static async createBook(req: Request, res: Response) {
    try {
      const bookData = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const userId = (req as any).user?.id;

      console.log('Creating book with data:', bookData);
      console.log('User ID:', userId);
      console.log('Files received:', files);

      if (!userId) {
        console.error('User not found in request:', (req as any).user);
        return sendResponse(res, 401, null, 'Unauthorized');
      }

      // Validate required fields
      if (!bookData.title || bookData.title.trim().length === 0) {
        console.error('Missing required field: title');
        return sendResponse(res, 400, null, 'Title is required');
      }

      // Validate book data
      const validationError = validateBookData(bookData);
      if (validationError) {
        console.error('Validation error:', validationError);
        return sendResponse(res, 400, null, validationError);
      }


      // Handle file uploads
      if (files && files.coverImage && files.coverImage[0]) {
        bookData.cover_image_url = `/uploads/${files.coverImage[0].filename}`;
        console.log('Cover image set:', bookData.cover_image_url);
        console.log('Cover image file details:', {
          filename: files.coverImage[0].filename,
          mimetype: files.coverImage[0].mimetype,
          size: files.coverImage[0].size
        });
      }
      if (files && files.pdfFile && files.pdfFile[0]) {
        bookData.pdf_url = `/uploads/${files.pdfFile[0].filename}`;
        console.log('PDF file set:', bookData.pdf_url);
        console.log('PDF file details:', {
          filename: files.pdfFile[0].filename,
          mimetype: files.pdfFile[0].mimetype,
          size: files.pdfFile[0].size
        });
      }

      // Handle field mapping (frontend might send camelCase, backend expects snake_case)
      if (bookData.coverImageUrl) {
        bookData.cover_image_url = bookData.coverImageUrl;
        delete bookData.coverImageUrl;
      }
      if (bookData.pdfUrl) {
        bookData.pdf_url = bookData.pdfUrl;
        delete bookData.pdfUrl;
      }
      if (bookData.originalPrice) {
        bookData.original_price = bookData.originalPrice;
        delete bookData.originalPrice;
      }
      if (bookData.isPublished) {
        bookData.is_published = bookData.isPublished === 'true' || bookData.isPublished === true;
        delete bookData.isPublished;
      }
      if (bookData.isFeatured) {
        bookData.is_featured = bookData.isFeatured === 'true' || bookData.isFeatured === true;
        delete bookData.isFeatured;
      }
      if (bookData.tableOfContents) {
        bookData.table_of_contents = bookData.tableOfContents;
        delete bookData.tableOfContents;
      }

      // Convert string values to appropriate types (FormData sends everything as strings)
      if (bookData.pages) {
        bookData.pages = Number(bookData.pages);
      }

      // Set default values
      bookData.is_published = false;
      bookData.status = bookData.status || 'draft';

      // Check database connection
      if (!AppDataSource.isInitialized) {
        console.error('Database not initialized');
        return sendResponse(res, 500, null, 'Database connection error');
      }

      // Check if Book entity is properly registered
      try {
        const bookMetadata = AppDataSource.getMetadata(Book);
        console.log('Book entity metadata:', bookMetadata);
      } catch (metadataError) {
        console.error('Error getting Book entity metadata:', metadataError);
        return sendResponse(res, 500, null, 'Book entity not properly configured');
      }

      // Check uploads directory
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '../../uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        console.error('Uploads directory does not exist:', uploadsDir);
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Created uploads directory:', uploadsDir);
      }

      // Create new book with explicit field mapping
      const bookToCreate = {
        title: bookData.title,
        slug: bookData.slug || bookData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: bookData.description || null,
        author: bookData.author || null,
        publisher: bookData.publisher || null,
        category: bookData.category || null,
        subject: bookData.subject || null,
        class: bookData.class || null,
        level: bookData.level || 'Foundation',
        coverImageUrl: bookData.cover_image_url || null,
        pdfUrl: bookData.pdf_url || null,
        pages: bookData.pages ? Number(bookData.pages) : undefined,
        isbn: bookData.isbn || null,
        status: bookData.status || 'draft',
        isPublished: bookData.is_published || false,
        isFeatured: bookData.is_featured || false,
        downloads: 0,
        tags: bookData.tags ? (Array.isArray(bookData.tags) ? bookData.tags : []) : undefined,
        tableOfContents: bookData.table_of_contents || null,
        summary: bookData.summary || null,
        createdBy: userId
      };

      console.log('Book data to create:', bookToCreate);

      const book = bookRepository.create(bookToCreate);

      console.log('Book entity created:', book);
      console.log('Book entity keys:', Object.keys(book));
      console.log('Book entity values:', Object.values(book));
      console.log('About to save book to database...');

      // Try to save the book with additional error context
      let savedBook;
      try {
        savedBook = await bookRepository.save(book);
      } catch (saveError: any) {
        console.error('Database save error:', saveError);
        console.error('Save error details:', {
          message: saveError.message,
          code: saveError.code,
          errno: saveError.errno,
          sqlState: saveError.sqlState,
          sqlMessage: saveError.sqlMessage,
          sql: saveError.sql
        });
        throw saveError; // Re-throw to be caught by outer catch
      }
      console.log('Book saved successfully:', savedBook);

      return sendResponse(res, 201, { book: savedBook }, 'Book created successfully');
    } catch (error: any) {
      console.error('Error creating book:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        query: error.query,
        parameters: error.parameters
      });
      
      // Handle specific database errors
      if (error.code === 'ER_DUP_ENTRY') {
        console.error('Duplicate entry error - slug might already exist');
        return sendResponse(res, 400, null, 'A book with this title already exists. Please use a different title.');
      }
      
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        console.error('Foreign key constraint error - user might not exist');
        return sendResponse(res, 400, null, 'Invalid user reference. Please log in again.');
      }
      
      // Send more detailed error information in development
      if (process.env.NODE_ENV !== 'production') {
        return sendResponse(res, 500, {
          error: error.message,
          details: error.stack,
          code: error.code,
          data: req.body,
          files: req.files
        }, 'Failed to create book');
      } else {
        return sendResponse(res, 500, null, 'Failed to create book');
      }
    }
  }

  // Update book (admin only)
  static async updateBook(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const book = await bookRepository.findOne({ where: { id } });
      if (!book) {
        return sendResponse(res, 404, null, 'Book not found');
      }

      // Handle file uploads
      if (files.coverImage && files.coverImage[0]) {
        updateData.coverImageUrl = `/uploads/${files.coverImage[0].filename}`;
      }
      if (files.pdfFile && files.pdfFile[0]) {
        updateData.pdfUrl = `/uploads/${files.pdfFile[0].filename}`;
      }

      // Update book
      Object.assign(book, updateData);
      if (updateData.title && !updateData.slug) {
        book.slug = updateData.title.toLowerCase().replace(/\s+/g, '-');
      }

      const updatedBook = await bookRepository.save(book);

      return sendResponse(res, 200, { book: updatedBook }, 'Book updated successfully');
    } catch (error) {
      console.error('Error updating book:', error);
      return sendResponse(res, 500, null, 'Failed to update book');
    }
  }

  // Delete book (admin only)
  static async deleteBook(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const book = await bookRepository.findOne({ where: { id } });
      if (!book) {
        return sendResponse(res, 404, null, 'Book not found');
      }

      await bookRepository.remove(book);

      return sendResponse(res, 200, null, 'Book deleted successfully');
    } catch (error) {
      console.error('Error deleting book:', error);
      return sendResponse(res, 500, null, 'Failed to delete book');
    }
  }

  // Publish/Unpublish book (admin only)
  static async togglePublishStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;

      const book = await bookRepository.findOne({ where: { id } });
      if (!book) {
        return sendResponse(res, 404, null, 'Book not found');
      }

      book.isPublished = isPublished;
      book.status = isPublished ? 'active' : 'draft';

      const updatedBook = await bookRepository.save(book);

      const message = isPublished ? 'Book published successfully' : 'Book unpublished successfully';
      return sendResponse(res, 200, { book: updatedBook }, message);
    } catch (error) {
      console.error('Error toggling book publish status:', error);
      return sendResponse(res, 500, null, 'Failed to update book status');
    }
  }

  // Get book statistics (admin only)
  static async getBookStats(_req: Request, res: Response) {
    try {
      const totalBooks = await bookRepository.count();
      const publishedBooks = await bookRepository.count({ where: { isPublished: true } });
      const draftBooks = await bookRepository.count({ where: { status: 'draft' } });
      const activeBooks = await bookRepository.count({ where: { status: 'active' } });

      const stats = {
        totalBooks,
        publishedBooks,
        draftBooks,
        activeBooks
      };

      return sendResponse(res, 200, { stats }, 'Book statistics retrieved successfully');
    } catch (error) {
      console.error('Error fetching book statistics:', error);
      return sendResponse(res, 500, null, 'Failed to fetch book statistics');
    }
  }
}
