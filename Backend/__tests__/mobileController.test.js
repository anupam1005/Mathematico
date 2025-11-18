const request = require('supertest');
const express = require('express');
const mobileController = require('../controllers/mobileController');

// Mock the database connection
jest.mock('../config/database', () => jest.fn().mockResolvedValue(true));

// Mock the models
jest.mock('../models/Book');
jest.mock('../models/Course');
jest.mock('../models/LiveClass');

const BookModel = require('../models/Book');
const CourseModel = require('../models/Course');
const LiveClassModel = require('../models/LiveClass');

// Create Express app for testing
const app = express();
app.use(express.json());

// Setup routes
app.get('/api/v1/mobile/books', mobileController.getAllBooks);
app.get('/api/v1/mobile/books/:id', mobileController.getBookById);
app.get('/api/v1/mobile/books/:id/viewer', mobileController.getSecurePdfViewer);
app.get('/api/v1/mobile/books/:id/stream', mobileController.streamSecurePdf);
app.get('/api/v1/mobile/courses', mobileController.getAllCourses);
app.get('/api/v1/mobile/courses/:id', mobileController.getCourseById);
app.get('/api/v1/mobile/live-classes', mobileController.getAllLiveClasses);
app.get('/api/v1/mobile/live-classes/:id', mobileController.getLiveClassById);
app.put('/api/v1/mobile/live-classes/:id/start', mobileController.startLiveClass);
app.put('/api/v1/mobile/live-classes/:id/end', mobileController.endLiveClass);
app.get('/api/v1/mobile/featured', mobileController.getFeaturedContent);
app.get('/api/v1/mobile/search', mobileController.search);
app.get('/api/v1/mobile/app-info', mobileController.getAppInfo);

describe('Mobile Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/mobile/books', () => {
    it('should return all published books', async () => {
      const mockBooks = [
        {
          _id: '1',
          title: 'Test Book 1',
          description: 'Test Description 1',
          author: 'Test Author',
          category: 'Mathematics',
          status: 'published',
          isAvailable: true,
        },
        {
          _id: '2',
          title: 'Test Book 2',
          description: 'Test Description 2',
          author: 'Test Author 2',
          category: 'Physics',
          status: 'published',
          isAvailable: true,
        },
      ];

      BookModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockBooks),
              }),
            }),
          }),
        }),
      });

      BookModel.countDocuments = jest.fn().mockResolvedValue(2);

      const response = await request(app)
        .get('/api/v1/mobile/books')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should handle pagination parameters', async () => {
      BookModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      BookModel.countDocuments = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/mobile/books?page=2&limit=5')
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should handle errors gracefully', async () => {
      BookModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockRejectedValue(new Error('Database error')),
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .get('/api/v1/mobile/books')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to fetch books');
    });
  });

  describe('GET /api/v1/mobile/books/:id', () => {
    it('should return a specific book by id', async () => {
      const mockBook = {
        _id: '1',
        title: 'Test Book',
        description: 'Test Description',
        author: 'Test Author',
        category: 'Mathematics',
        status: 'published',
        isAvailable: true,
      };

      BookModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockBook),
      });

      const response = await request(app)
        .get('/api/v1/mobile/books/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Book');
    });

    it('should return 404 when book not found', async () => {
      BookModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app)
        .get('/api/v1/mobile/books/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Book not found or not available');
    });
  });

  describe('GET /api/v1/mobile/courses', () => {
    it('should return all published courses', async () => {
      const mockCourses = [
        {
          _id: '1',
          title: 'Test Course 1',
          description: 'Test Description 1',
          instructor: 'Test Instructor',
          category: 'Mathematics',
          level: 'Intermediate',
          status: 'published',
          isAvailable: true,
        },
      ];

      CourseModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockCourses),
              }),
            }),
          }),
        }),
      });

      CourseModel.countDocuments = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/mobile/courses')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should filter courses by category', async () => {
      CourseModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      CourseModel.countDocuments = jest.fn().mockResolvedValue(0);

      await request(app)
        .get('/api/v1/mobile/courses?category=Mathematics')
        .expect(200);

      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Mathematics' })
      );
    });
  });

  describe('GET /api/v1/mobile/courses/:id', () => {
    it('should return a specific course by id', async () => {
      const mockCourse = {
        _id: '1',
        title: 'Test Course',
        description: 'Test Description',
        instructor: 'Test Instructor',
        status: 'published',
        isAvailable: true,
      };

      CourseModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockCourse),
        }),
      });

      const response = await request(app)
        .get('/api/v1/mobile/courses/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Course');
    });

    it('should return 404 when course not found', async () => {
      CourseModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const response = await request(app)
        .get('/api/v1/mobile/courses/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/mobile/live-classes', () => {
    it('should return all upcoming live classes', async () => {
      const mockLiveClasses = [
        {
          _id: '1',
          title: 'Test Live Class 1',
          description: 'Test Description 1',
          instructor: 'Test Instructor',
          startTime: new Date(Date.now() + 86400000), // Tomorrow
          duration: 60,
          status: 'scheduled',
          isAvailable: true,
        },
      ];

      LiveClassModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockLiveClasses),
              }),
            }),
          }),
        }),
      });

      LiveClassModel.countDocuments = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/mobile/live-classes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/mobile/live-classes/:id', () => {
    it('should return a specific live class by id', async () => {
      const mockLiveClass = {
        _id: '1',
        title: 'Test Live Class',
        description: 'Test Description',
        instructor: 'Test Instructor',
        isAvailable: true,
      };

      LiveClassModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockLiveClass),
        }),
      });

      const response = await request(app)
        .get('/api/v1/mobile/live-classes/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Live Class');
    });
  });

  describe('PUT /api/v1/mobile/live-classes/:id/start', () => {
    it('should start a live class', async () => {
      const mockLiveClass = {
        _id: '1',
        title: 'Test Live Class',
        status: 'scheduled',
        startClass: jest.fn().mockResolvedValue(true),
      };

      LiveClassModel.findById = jest.fn().mockResolvedValue(mockLiveClass);

      const response = await request(app)
        .put('/api/v1/mobile/live-classes/1/start')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockLiveClass.startClass).toHaveBeenCalled();
    });

    it('should return 404 when live class not found', async () => {
      LiveClassModel.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/mobile/live-classes/999/start')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/mobile/live-classes/:id/end', () => {
    it('should end a live class', async () => {
      const mockLiveClass = {
        _id: '1',
        title: 'Test Live Class',
        status: 'live',
        endClass: jest.fn().mockResolvedValue(true),
      };

      LiveClassModel.findById = jest.fn().mockResolvedValue(mockLiveClass);

      const response = await request(app)
        .put('/api/v1/mobile/live-classes/1/end')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockLiveClass.endClass).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/mobile/featured', () => {
    it('should return featured content', async () => {
      const response = await request(app)
        .get('/api/v1/mobile/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('books');
      expect(response.body.data).toHaveProperty('courses');
      expect(response.body.data).toHaveProperty('liveClasses');
    });
  });

  describe('GET /api/v1/mobile/search', () => {
    it('should search content', async () => {
      const response = await request(app)
        .get('/api/v1/mobile/search?query=test&type=book')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/mobile/app-info', () => {
    it('should return app information', async () => {
      const response = await request(app)
        .get('/api/v1/mobile/app-info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appName).toBe('Mathematico');
      expect(response.body.data.version).toBe('2.0.0');
    });
  });

  describe('GET /api/v1/mobile/books/:id/viewer', () => {
    it('should return secure PDF viewer URL', async () => {
      const mockBook = {
        _id: '1',
        title: 'Test Book',
        pdfFile: 'https://cloudinary.com/test.pdf',
        status: 'published',
        isAvailable: true,
      };

      BookModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockBook),
      });

      const response = await request(app)
        .get('/api/v1/mobile/books/1/viewer')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.viewerUrl).toBeDefined();
      expect(response.body.data.restrictions.download).toBe(false);
    });

    it('should return 404 when book has no PDF', async () => {
      const mockBook = {
        _id: '1',
        title: 'Test Book',
        pdfFile: null,
      };

      BookModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockBook),
      });

      const response = await request(app)
        .get('/api/v1/mobile/books/1/viewer')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Timeout handling', () => {
    it('should handle request timeout', async () => {
      jest.setTimeout(30000);

      BookModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockImplementation(() => 
                  new Promise((resolve) => setTimeout(() => resolve([]), 26000))
                ),
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .get('/api/v1/mobile/books')
        .timeout(30000);

      // Should either complete or timeout gracefully
      expect([200, 504]).toContain(response.status);
    });
  });
});
