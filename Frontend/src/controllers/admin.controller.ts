import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Course } from '../entities/Course';
import { Module } from '../entities/Module';
import { Lesson } from '../entities/Lesson';
import { Setting } from '../entities/Setting';
import { User } from '../entities/User';
import { LiveClass } from '../entities/LiveClass';
import { Repository } from 'typeorm';
import { sendResponse } from '../utils/apiResponse';
import { StatusCodes } from 'http-status-codes';

// Extend Express Request interface to include files
declare global {
  namespace Express {
    interface Request {
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
    }
  }
}

export class AdminController {
  private courseRepository: Repository<Course>;
  private moduleRepository: Repository<Module>;
  private lessonRepository: Repository<Lesson>;
  private settingRepository: Repository<Setting>;
  private userRepository: Repository<User>;
  private liveClassRepository: Repository<LiveClass>;

  constructor() {
    this.courseRepository = AppDataSource.getRepository(Course);
    this.moduleRepository = AppDataSource.getRepository(Module);
    this.lessonRepository = AppDataSource.getRepository(Lesson);
    this.settingRepository = AppDataSource.getRepository(Setting);
    this.userRepository = AppDataSource.getRepository(User);
    this.liveClassRepository = AppDataSource.getRepository(LiveClass);
  }

  // Dashboard
  getDashboardData = async (_req: Request, res: Response): Promise<void> => {
    try {
      const [
        totalUsers,
        totalCourses,
        totalModules,
        totalLessons,
        totalLiveClasses
      ] = await Promise.all([
        this.userRepository.count(),
        this.courseRepository.count(),
        this.moduleRepository.count(),
        this.lessonRepository.count(),
        this.liveClassRepository.count()
      ]);

      // Get book count from BookController or set to 0 for now
      const totalBooks = 0;

      const recentUsers = await this.userRepository.find({
        order: { createdAt: 'DESC' },
        take: 5
      });

      const recentCourses = await this.courseRepository.find({
        order: { createdAt: 'DESC' },
        take: 5
      });

      // Calculate additional stats
      const totalStudents = await this.userRepository.count({ where: { isAdmin: false } });
      const totalRevenue = 0; // Placeholder - implement actual revenue calculation

      sendResponse(res, StatusCodes.OK, {
        stats: {
          totalUsers,
          totalStudents,
          totalCourses,
          totalModules,
          totalLessons,
          totalBooks,
          totalLiveClasses,
          totalRevenue,
          activeBatches: 0 // Placeholder
        },
        recentUsers,
        recentCourses
      }, 'Dashboard data retrieved successfully');
    } catch (error) {
      console.error('Dashboard error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to get dashboard data');
    }
  };

  // Course Management - Admin can see all courses including drafts
  getAllCourses = async (_req: Request, res: Response): Promise<void> => {
    try {
      console.log('Getting all courses (admin view - including drafts)...');
      
      // Use query builder to ensure all fields are selected
      const courses = await AppDataSource.getRepository(Course)
        .createQueryBuilder('course')
        .leftJoinAndSelect('course.instructor', 'instructor')
        .select([
          'course.id',
          'course.title',
          'course.slug',
          'course.description',
          'course.thumbnailUrl',
          'course.price',
          'course.originalPrice',
          'course.isPublished',
          'course.status',
          'course.level',
          'course.category',
          'course.class',
          'course.subject',
          'course.duration',
          'course.content',
          'course.requirements',
          'course.whatYouWillLearn',
          'course.whoIsThisFor',
          'course.topics',
          'course.isFeatured',
          'course.students',
          'course.createdBy',
          'course.createdAt',
          'course.updatedAt',
          'instructor.id',
          'instructor.name',
          'instructor.email'
        ])
        .orderBy('course.createdAt', 'DESC')
        .getMany();
      
      console.log(`Found ${courses.length} courses (including drafts):`, courses);
      console.log('Sample course thumbnailUrl:', courses[0]?.thumbnailUrl);
      console.log('Sending response with courses data');
      sendResponse(res, StatusCodes.OK, courses, 'All courses retrieved successfully (including drafts)');
    } catch (error) {
      console.error('Get courses error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to get courses');
    }
  };

  getCourseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log('Getting course by ID (admin view - including drafts):', id);
      
      const course = await this.courseRepository.findOne({ 
        where: { id },
        relations: ['instructor', 'modules', 'modules.lessons']
      });
      
      if (!course) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Course not found');
        return;
      }
      
      console.log('Found course (including draft status):', course);
      sendResponse(res, StatusCodes.OK, course, 'Course retrieved successfully (including draft status)');
    } catch (error) {
      console.error('Get course by ID error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to get course');
    }
  };

  createCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('=== CREATE COURSE DEBUG ===');
      console.log('Request method:', req.method);
      console.log('Request URL:', req.url);
      console.log('Request headers:', req.headers);
      console.log('Content-Type header:', req.headers['content-type']);
      console.log('Request body:', req.body);
      console.log('Request body type:', typeof req.body);
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request file:', req.file);
      console.log('Request files:', req.files);
      
      const courseData = req.body;
      const file = req.file as Express.Multer.File;
      
      // Set the createdBy field from the authenticated user
      const user = req.user as any;
      
      if (!user || !user.id) {
        console.error('User not found in request:', req.user);
        sendResponse(res, StatusCodes.UNAUTHORIZED, null, 'User not authenticated');
        return;
      }
      
      courseData.createdBy = user.id;
      
      // Validate required fields
      console.log('Validating required fields...');
      console.log('Title:', courseData.title);
      console.log('Slug:', courseData.slug);
      console.log('All fields in courseData:', Object.keys(courseData));
      
      if (!courseData.title || !courseData.slug) {
        console.error('Missing required fields:', { title: courseData.title, slug: courseData.slug });
        console.error('Available fields in req.body:', Object.keys(req.body));
        console.error('Raw req.body values:', req.body);
        sendResponse(res, StatusCodes.BAD_REQUEST, null, 'Title and slug are required');
        return;
      }
      
      // Set default values
      courseData.isPublished = false;
      courseData.status = courseData.status || 'draft';
      
      // Handle file uploads
      if (file) {
        courseData.thumbnailUrl = `/uploads/${file.filename}`;
        console.log('Thumbnail image uploaded:', courseData.thumbnailUrl);
        console.log('Thumbnail image file details:', {
          filename: file.filename,
          mimetype: (file as any).mimetype,
          size: (file as any).size
        });
      } else if (courseData.thumbnailUrl) {
        // Keep the thumbnailUrl as is - TypeORM will map it to thumbnail_url column
        console.log('Using existing thumbnail URL:', courseData.thumbnailUrl);
      }
      
      // Convert string values to proper data types for database
      if (courseData.price) {
        courseData.price = Number(courseData.price);
      }
      if (courseData.originalPrice) {
        courseData.originalPrice = Number(courseData.originalPrice);
      }
      if (courseData.students) {
        courseData.students = Number(courseData.students);
      }
      if (courseData.isFeatured !== undefined) {
        courseData.isFeatured = courseData.isFeatured === 'true' || courseData.isFeatured === true;
      }
      if (courseData.isPublished !== undefined) {
        courseData.isPublished = courseData.isPublished === 'true' || courseData.isPublished === true;
      }
      
      // Parse JSON fields if they're strings
      if (typeof courseData.whatYouWillLearn === 'string') {
        try {
          courseData.whatYouWillLearn = JSON.parse(courseData.whatYouWillLearn);
        } catch (e) {
          courseData.whatYouWillLearn = [];
        }
      }
      if (typeof courseData.whoIsThisFor === 'string') {
        try {
          courseData.whoIsThisFor = JSON.parse(courseData.whoIsThisFor);
        } catch (e) {
          courseData.whoIsThisFor = [];
        }
      }
      if (typeof courseData.topics === 'string') {
        try {
          courseData.topics = JSON.parse(courseData.topics);
        } catch (e) {
          courseData.topics = [];
        }
      }
      
      console.log('Final course data to save:', courseData);
      console.log('User ID:', user.id);
      console.log('User object:', user);
      
      // Check database connection
      if (!AppDataSource.isInitialized) {
        console.error('Database not initialized');
        sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Database connection error');
        return;
      }
      
      const course = this.courseRepository.create(courseData);
      const savedCourse = await this.courseRepository.save(course);
      
      console.log('Course created successfully:', savedCourse);
      sendResponse(res, StatusCodes.CREATED, savedCourse, 'Course created successfully');
    } catch (error: any) {
      console.error('=== CREATE COURSE ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.code) {
        console.error('Database error code:', error.code);
      }
      if (error.sql) {
        console.error('SQL error:', error.sql);
      }
      
      // Send more detailed error information in development
      if (process.env.NODE_ENV !== 'production') {
        sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, {
          error: error.message,
          details: error.stack,
          data: req.body,
          file: req.file
        }, 'Failed to create course');
      } else {
        sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to create course');
      }
    }
  };

  updateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const courseData = req.body;
      const file = req.file as Express.Multer.File;
      
      const course = await this.courseRepository.findOne({ where: { id } });
      if (!course) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Course not found');
        return;
      }

      // Handle file uploads
      if (file) {
        courseData.thumbnailUrl = `/uploads/${file.filename}`;
        console.log('Thumbnail image updated:', courseData.thumbnailUrl);
        console.log('Thumbnail image file details:', {
          filename: file.filename,
          mimetype: (file as any).mimetype,
          size: (file as any).size
        });
      } else if (courseData.thumbnailUrl) {
        // Keep the thumbnailUrl as is - TypeORM will map it to thumbnail_url column
        console.log('Using existing thumbnail URL:', courseData.thumbnailUrl);
      }

      // Convert string values to proper data types for database
      if (courseData.price) {
        courseData.price = Number(courseData.price);
      }
      if (courseData.originalPrice) {
        courseData.originalPrice = Number(courseData.originalPrice);
      }
      if (courseData.students) {
        courseData.students = Number(courseData.students);
      }
      if (courseData.isFeatured !== undefined) {
        courseData.isFeatured = courseData.isFeatured === 'true' || courseData.isFeatured === true;
      }
      if (courseData.isPublished !== undefined) {
        courseData.isPublished = courseData.isPublished === 'true' || courseData.isPublished === true;
      }
      
      // Parse JSON fields if they're strings
      if (typeof courseData.whatYouWillLearn === 'string') {
        try {
          courseData.whatYouWillLearn = JSON.parse(courseData.whatYouWillLearn);
        } catch (e) {
          courseData.whatYouWillLearn = [];
        }
      }
      if (typeof courseData.whoIsThisFor === 'string') {
        try {
          courseData.whoIsThisFor = JSON.parse(courseData.whoIsThisFor);
        } catch (e) {
          courseData.whoIsThisFor = [];
        }
      }
      if (typeof courseData.topics === 'string') {
        try {
          courseData.topics = JSON.parse(courseData.topics);
        } catch (e) {
          courseData.topics = [];
        }
      }

      Object.assign(course, courseData);
      const updatedCourse = await this.courseRepository.save(course);
      sendResponse(res, StatusCodes.OK, updatedCourse, 'Course updated successfully');
    } catch (error) {
      console.error('Update course error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to update course');
    }
  };

  deleteCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const course = await this.courseRepository.findOne({ where: { id } });
      
      if (!course) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Course not found');
        return;
      }

      await this.courseRepository.remove(course);
      sendResponse(res, StatusCodes.OK, null, 'Course deleted successfully');
    } catch (error) {
      console.error('Delete course error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to delete course');
    }
  };

  // Publish/Unpublish Course
  publishCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;
      
      const course = await this.courseRepository.findOne({ where: { id } });
      if (!course) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Course not found');
        return;
      }

      course.isPublished = isPublished;
      course.status = isPublished ? 'active' : 'draft';
      
      const updatedCourse = await this.courseRepository.save(course);
      
      const message = isPublished ? 'Course published successfully' : 'Course unpublished successfully';
      sendResponse(res, StatusCodes.OK, updatedCourse, message);
    } catch (error) {
      console.error('Publish course error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to update course publish status');
    }
  };

  // User Management
  getAllUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userRepository.find({
        order: { createdAt: 'DESC' }
      });
      sendResponse(res, StatusCodes.OK, users, 'Users retrieved successfully');
    } catch (error) {
      console.error('Get users error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to get users');
    }
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userRepository.findOne({ where: { id } });
      
      if (!user) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'User not found');
        return;
      }

      sendResponse(res, StatusCodes.OK, user, 'User retrieved successfully');
    } catch (error) {
      console.error('Get user error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to get user');
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'User not found');
        return;
      }

      Object.assign(user, userData);
      const updatedUser = await this.userRepository.save(user);
      sendResponse(res, StatusCodes.OK, updatedUser, 'User updated successfully');
    } catch (error) {
      console.error('Update user error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to update user');
    }
  };

  updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'User not found');
        return;
      }

      user.isActive = isActive;
      const updatedUser = await this.userRepository.save(user);
      sendResponse(res, StatusCodes.OK, updatedUser, 'User status updated successfully');
    } catch (error) {
      console.error('Update user status error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to update user status');
    }
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userRepository.findOne({ where: { id } });
      
      if (!user) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'User not found');
        return;
      }

      await this.userRepository.remove(user);
      sendResponse(res, StatusCodes.OK, null, 'User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to delete user');
    }
  };

  // Module Management
  createModule = async (req: Request, res: Response): Promise<void> => {
    try {
      const moduleData = req.body;
      const module = this.moduleRepository.create(moduleData);
      const savedModule = await this.moduleRepository.save(module);
      sendResponse(res, StatusCodes.CREATED, savedModule, 'Module created successfully');
    } catch (error) {
      console.error('Create module error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to create module');
    }
  };

  updateModule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const moduleData = req.body;
      
      const module = await this.moduleRepository.findOne({ where: { id } });
      if (!module) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Module not found');
        return;
      }

      Object.assign(module, moduleData);
      const updatedModule = await this.moduleRepository.save(module);
      sendResponse(res, StatusCodes.OK, updatedModule, 'Module updated successfully');
    } catch (error) {
      console.error('Update module error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to update module');
    }
  };

  deleteModule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const module = await this.moduleRepository.findOne({ where: { id } });
      
      if (!module) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Module not found');
        return;
      }

      await this.moduleRepository.remove(module);
      sendResponse(res, StatusCodes.OK, null, 'Module deleted successfully');
    } catch (error) {
      console.error('Delete module error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to delete module');
    }
  };

  // Settings Management
  getSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.settingRepository.find();
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      
      sendResponse(res, StatusCodes.OK, settingsMap, 'Settings retrieved successfully');
    } catch (error) {
      console.error('Get settings error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to get settings');
    }
  };

  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settingsData = req.body;
      
      for (const [key, value] of Object.entries(settingsData)) {
        let setting = await this.settingRepository.findOne({ where: { key } });
        
        if (setting) {
          setting.value = value as string;
          await this.settingRepository.save(setting);
        } else {
          setting = this.settingRepository.create({ key, value: value as string });
          await this.settingRepository.save(setting);
        }
      }
      
      sendResponse(res, StatusCodes.OK, null, 'Settings updated successfully');
    } catch (error) {
      console.error('Update settings error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to update settings');
    }
  };

    // Book Management - Delegated to BookController for consistency
  // All book operations are now handled by the specialized BookController

  // Live Class Management
  getAllLiveClasses = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, category, search } = req.query;
      
      const queryBuilder = this.liveClassRepository
        .createQueryBuilder('liveClass')
        .leftJoinAndSelect('liveClass.instructor', 'instructor');

      // Apply filters
      if (status) {
        queryBuilder.andWhere('liveClass.status = :status', { status });
      }
      if (category) {
        queryBuilder.andWhere('liveClass.category = :category', { category });
      }
      if (search) {
        queryBuilder.andWhere(
          '(liveClass.title LIKE :search OR liveClass.description LIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      const [liveClasses, total] = await queryBuilder
        .skip(skip)
        .take(Number(limit))
        .orderBy('liveClass.scheduledAt', 'ASC')
        .getManyAndCount();

      const totalPages = Math.ceil(total / Number(limit));

      sendResponse(res, StatusCodes.OK, {
        liveClasses,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages
        }
      }, 'Live classes retrieved successfully');
    } catch (error) {
      console.error('Get live classes error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to get live classes');
    }
  };

  getLiveClassById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const liveClass = await this.liveClassRepository.findOne({ where: { id } });
      
      if (!liveClass) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Live class not found');
        return;
      }

      sendResponse(res, StatusCodes.OK, liveClass, 'Live class retrieved successfully');
    } catch (error) {
      console.error('Get live class error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to get live class');
    }
  };

  createLiveClass = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🚀 AdminController createLiveClass called');
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
      console.log('Request file:', req.file);
      
      const liveClassData = req.body;
      const file = req.file;
      
      // Validate required fields
      if (!liveClassData.title || liveClassData.title.trim().length === 0) {
        console.error('Missing required field: title');
        sendResponse(res, StatusCodes.BAD_REQUEST, null, 'Title is required');
        return;
      }
      
      // Set the createdBy and instructorId field from the authenticated user
      const user = req.user as any;
      liveClassData.createdBy = user.id;
      liveClassData.instructorId = liveClassData.instructorId || user.id;
      
      // Generate slug if not provided
      if (!liveClassData.slug) {
        liveClassData.slug = liveClassData.title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
      
      // Handle file uploads
      if (file) {
        liveClassData.thumbnailUrl = `/uploads/${file.filename}`;
        console.log('Thumbnail image uploaded:', liveClassData.thumbnailUrl);
        console.log('Thumbnail image file details:', {
          filename: file.filename,
          mimetype: (file as any).mimetype,
          size: (file as any).size
        });
      } else if (liveClassData.thumbnailUrl) {
        // Keep the thumbnailUrl as is - TypeORM will map it to thumbnail_url column
        console.log('Using existing thumbnail URL:', liveClassData.thumbnailUrl);
      }
      
      // Set default values
      liveClassData.isPublished = false;
      liveClassData.status = liveClassData.status || 'draft';
      liveClassData.enrolledStudents = 0;
      liveClassData.duration = liveClassData.duration || 60;
      liveClassData.maxStudents = liveClassData.maxStudents || 50;
      liveClassData.level = liveClassData.level || 'Foundation';
      
      // Convert string values to proper data types for database
      if (liveClassData.duration) {
        liveClassData.duration = Number(liveClassData.duration);
      }
      if (liveClassData.maxStudents) {
        liveClassData.maxStudents = Number(liveClassData.maxStudents);
      }
      if (liveClassData.isFeatured !== undefined) {
        liveClassData.isFeatured = liveClassData.isFeatured === 'true' || liveClassData.isFeatured === true;
      }
      if (liveClassData.isPublished !== undefined) {
        liveClassData.isPublished = liveClassData.isPublished === 'true' || liveClassData.isPublished === true;
      }
      if (liveClassData.isRecordingEnabled !== undefined) {
        liveClassData.isRecordingEnabled = liveClassData.isRecordingEnabled === 'true' || liveClassData.isRecordingEnabled === true;
      }
      
      // Parse JSON fields if they're strings
      if (typeof liveClassData.topics === 'string') {
        try {
          liveClassData.topics = JSON.parse(liveClassData.topics);
        } catch (e) {
          liveClassData.topics = [];
        }
      }
      
      console.log('Final live class data before save:', liveClassData);
      
      const liveClass = this.liveClassRepository.create(liveClassData);
      console.log('Created live class entity:', liveClass);
      
      const savedLiveClass = await this.liveClassRepository.save(liveClass);
      sendResponse(res, StatusCodes.CREATED, savedLiveClass, 'Live class created successfully');
    } catch (error) {
      console.error('Create live class error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to create live class');
    }
  };

  updateLiveClass = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🚀 AdminController updateLiveClass called');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);
      
      const { id } = req.params;
      const liveClassData = req.body;
      const file = req.file;
      
      const liveClass = await this.liveClassRepository.findOne({ where: { id } });
      if (!liveClass) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Live class not found');
        return;
      }

      // Handle file uploads
      if (file) {
        liveClassData.thumbnailUrl = `/uploads/${file.filename}`;
        console.log('Thumbnail image uploaded:', liveClassData.thumbnailUrl);
        console.log('Thumbnail image file details:', {
          filename: file.filename,
          mimetype: (file as any).mimetype,
          size: (file as any).size
        });
      }

      // Convert string values to proper data types for database
      if (liveClassData.duration) {
        liveClassData.duration = Number(liveClassData.duration);
      }
      if (liveClassData.maxStudents) {
        liveClassData.maxStudents = Number(liveClassData.maxStudents);
      }
      if (liveClassData.isFeatured !== undefined) {
        liveClassData.isFeatured = liveClassData.isFeatured === 'true' || liveClassData.isFeatured === true;
      }
      if (liveClassData.isPublished !== undefined) {
        liveClassData.isPublished = liveClassData.isPublished === 'true' || liveClassData.isPublished === true;
      }
      if (liveClassData.isRecordingEnabled !== undefined) {
        liveClassData.isRecordingEnabled = liveClassData.isRecordingEnabled === 'true' || liveClassData.isRecordingEnabled === true;
      }
      
      // Parse JSON fields if they're strings
      if (typeof liveClassData.topics === 'string') {
        try {
          liveClassData.topics = JSON.parse(liveClassData.topics);
        } catch (e) {
          liveClassData.topics = [];
        }
      }

      Object.assign(liveClass, liveClassData);
      const updatedLiveClass = await this.liveClassRepository.save(liveClass);
      sendResponse(res, StatusCodes.OK, updatedLiveClass, 'Live class updated successfully');
    } catch (error) {
      console.error('Update live class error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to update live class');
    }
  };

  deleteLiveClass = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const liveClass = await this.liveClassRepository.findOne({ where: { id } });
      
      if (!liveClass) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Live class not found');
        return;
      }

      await this.liveClassRepository.remove(liveClass);
      sendResponse(res, StatusCodes.OK, null, 'Live class deleted successfully');
    } catch (error) {
      console.error('Delete live class error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to delete live class');
    }
  };

  toggleLiveClassPublishStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;
      
      const liveClass = await this.liveClassRepository.findOne({ where: { id } });
      if (!liveClass) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Live class not found');
        return;
      }

      liveClass.isPublished = isPublished;
      liveClass.status = isPublished ? 'scheduled' : 'draft';
      
      const updatedLiveClass = await this.liveClassRepository.save(liveClass);
      
      const message = isPublished ? 'Live class published successfully' : 'Live class unpublished successfully';
      sendResponse(res, StatusCodes.OK, updatedLiveClass, message);
    } catch (error) {
      console.error('Toggle live class publish status error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to update live class publish status');
    }
  };

  startLiveClass = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const liveClass = await this.liveClassRepository.findOne({ where: { id } });
      if (!liveClass) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Live class not found');
        return;
      }

      liveClass.status = 'live';
      
      const updatedLiveClass = await this.liveClassRepository.save(liveClass);
      sendResponse(res, StatusCodes.OK, updatedLiveClass, 'Live class started successfully');
    } catch (error) {
      console.error('Start live class error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to start live class');
    }
  };

  endLiveClass = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const liveClass = await this.liveClassRepository.findOne({ where: { id } });
      if (!liveClass) {
        sendResponse(res, StatusCodes.NOT_FOUND, null, 'Live class not found');
        return;
      }

      liveClass.status = 'completed';
      
      const updatedLiveClass = await this.liveClassRepository.save(liveClass);
      sendResponse(res, StatusCodes.OK, updatedLiveClass, 'Live class ended successfully');
    } catch (error) {
      console.error('End live class error:', error);
      sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to end live class');
    }
  };
}

export const adminController = new AdminController();
