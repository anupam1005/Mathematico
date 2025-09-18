import { Request, Response } from 'express';
import { LiveClass } from '../entities/LiveClass';
import { AppDataSource } from '../config/data-source';
import { sendResponse } from '../utils/apiResponse';
import { validateLiveClassData } from '../utils/validation';

const liveClassRepository = AppDataSource.getRepository(LiveClass);

export class LiveClassController {
  // Test endpoint to check database connection and table
  static async testDatabaseConnection(req: Request, res: Response) {
    try {
      console.log('🧪 Testing database connection...');
      
      // Check database connection
      if (!AppDataSource.isInitialized) {
        return sendResponse(res, 500, null, 'Database not initialized');
      }
      
      // Check if table exists by trying to count records
      const count = await liveClassRepository.count();
      console.log('✅ Live classes table accessible, count:', count);
      
      // Check entity metadata
      try {
        const metadata = AppDataSource.getMetadata(LiveClass);
        console.log('✅ Entity metadata accessible');
      } catch (error) {
        console.error('❌ Entity metadata error:', error);
      }
      
      return sendResponse(res, 200, { 
        databaseConnected: true, 
        tableAccessible: true, 
        recordCount: count 
      }, 'Database connection test successful');
    } catch (error: any) {
      console.error('❌ Database test error:', error);
      return sendResponse(res, 500, null, `Database test failed: ${error.message}`);
    }
  }

  // Get all published live classes (for students)
  static async getPublishedLiveClasses(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, category, subject, level, status, search } = req.query;
      
      const queryBuilder = liveClassRepository
        .createQueryBuilder('liveClass')
        .leftJoinAndSelect('liveClass.instructor', 'instructor')
        .where('liveClass.isPublished = :isPublished', { isPublished: true });

      // Apply filters
      if (category) {
        queryBuilder.andWhere('liveClass.category = :category', { category });
      }
      if (subject) {
        queryBuilder.andWhere('liveClass.subject = :subject', { subject });
      }
      if (level) {
        queryBuilder.andWhere('liveClass.level = :level', { level });
      }
      if (status) {
        queryBuilder.andWhere('liveClass.status = :status', { status });
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

      return sendResponse(res, 200, {
        liveClasses,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages
        }
      }, 'Live classes retrieved successfully');
    } catch (error) {
      console.error('Error fetching published live classes:', error);
      return sendResponse(res, 500, null, 'Failed to fetch live classes');
    }
  }

  // Get live class by ID (for students)
  static async getLiveClassById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log('🔍 Fetching live class with ID:', id);
      
      // Find the live class by ID (allow both published and unpublished for now)
      const liveClass = await liveClassRepository.findOne({
        where: { id }
      });

      console.log('📊 Live class found:', liveClass ? 'Yes' : 'No');
      if (liveClass) {
        console.log('📋 Live class data:', {
          id: liveClass.id,
          title: liveClass.title,
          instructorId: liveClass.instructorId,
          status: liveClass.status,
          isPublished: liveClass.isPublished
        });
      }

      if (!liveClass) {
        return sendResponse(res, 404, null, 'Live class not found');
      }

      return sendResponse(res, 200, { liveClass }, 'Live class retrieved successfully');
    } catch (error) {
      console.error('❌ Error fetching live class:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      return sendResponse(res, 500, null, 'Failed to fetch live class');
    }
  }

  // Get all live classes (admin only)
  static async getAllLiveClasses(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, category, search } = req.query;
      
      const queryBuilder = liveClassRepository
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

      return sendResponse(res, 200, {
        liveClasses,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages
        }
      }, 'Live classes retrieved successfully');
    } catch (error) {
      console.error('Error fetching all live classes:', error);
      return sendResponse(res, 500, null, 'Failed to fetch live classes');
    }
  }

  // Get live class by ID (admin version)
  static async getLiveClassByIdAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const liveClass = await liveClassRepository.findOne({
        where: { id },
        relations: ['instructor']
      });

      if (!liveClass) {
        return sendResponse(res, 404, null, 'Live class not found');
      }

      return sendResponse(res, 200, { liveClass }, 'Live class retrieved successfully');
    } catch (error) {
      console.error('Error fetching live class:', error);
      return sendResponse(res, 500, null, 'Failed to fetch live class');
    }
  }

  // Create new live class (admin only)
  static async createLiveClass(req: Request, res: Response) {
    try {
      console.log('🚀 LiveClass createLiveClass called');
      console.log('Request method:', req.method);
      console.log('Request URL:', req.url);
      console.log('Request headers:', req.headers);
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
      console.log('Request file:', req.file);
      
      const liveClassData = req.body;
      const file = req.file as Express.Multer.File;
      const userId = (req as any).user?.id;

      // Ensure uploads directory exists
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Created uploads directory:', uploadsDir);
      }

      console.log('Creating live class with data:', liveClassData);
      console.log('User ID:', userId);
      console.log('User object:', (req as any).user);
      console.log('User object type:', typeof (req as any).user);
      console.log('User object keys:', (req as any).user ? Object.keys((req as any).user) : 'No user object');
      console.log('File received:', file);

      if (!userId) {
        console.error('User not found in request:', (req as any).user);
        return sendResponse(res, 401, null, 'Unauthorized');
      }

      // Validate required fields
      if (!liveClassData.title || liveClassData.title.trim().length === 0) {
        console.error('Missing required field: title');
        return sendResponse(res, 400, null, 'Title is required');
      }

      // Validate live class data
      const validationError = validateLiveClassData(liveClassData);
      if (validationError) {
        console.error('Validation error:', validationError);
        return sendResponse(res, 400, null, validationError);
      }

      // Handle file uploads
      if (file) {
        liveClassData.thumbnailUrl = `/uploads/${file.filename}`;
        console.log('Thumbnail image set:', liveClassData.thumbnailUrl);
        console.log('Thumbnail image file details:', {
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size
        });
      }

      // Prepare the data for entity creation
      const liveClassToCreate = {
        ...liveClassData,
        instructorId: liveClassData.instructorId || userId,
        createdBy: userId,
        slug: liveClassData.slug || liveClassData.title.toLowerCase().replace(/\s+/g, '-')
      };

      console.log('Data to create live class:', liveClassToCreate);
      console.log('Database connection status:', AppDataSource.isInitialized);
      
      // Check if database is connected
      if (!AppDataSource.isInitialized) {
        console.error('❌ Database not initialized');
        return sendResponse(res, 500, null, 'Database connection not available');
      }
      
      // Check if repository is available
      if (!liveClassRepository) {
        console.error('❌ LiveClass repository not available');
        return sendResponse(res, 500, null, 'Repository not available');
      }
      
      try {
        console.log('LiveClass entity metadata:', AppDataSource.getMetadata(LiveClass));
      } catch (metadataError) {
        console.error('❌ Error getting entity metadata:', metadataError);
      }

      // Create new live class
      const liveClass = liveClassRepository.create(liveClassToCreate);

      console.log('Created live class entity:', liveClass);

      const savedLiveClass = await liveClassRepository.save(liveClass);

      return sendResponse(res, 201, { liveClass: savedLiveClass }, 'Live class created successfully');
    } catch (error: any) {
      console.error('Error creating live class:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        query: error.query,
        parameters: error.parameters
      });
      
      // Check if it's a database connection issue
      if (!AppDataSource.isInitialized) {
        console.error('Database not initialized');
        return sendResponse(res, 500, null, 'Database connection not available');
      }
      
      // Check if it's a validation error
      if (error.message && error.message.includes('validation')) {
        return sendResponse(res, 400, null, `Validation error: ${error.message}`);
      }
      
      // Check if it's a duplicate entry error
      if (error.code === 'ER_DUP_ENTRY') {
        return sendResponse(res, 400, null, 'A live class with this title or slug already exists');
      }
      
      return sendResponse(res, 500, null, 'Failed to create live class');
    }
  }

  // Update live class (admin only)
  static async updateLiveClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const file = req.file as Express.Multer.File;

      console.log('Updating live class with data:', updateData);
      console.log('File received:', file);

      const liveClass = await liveClassRepository.findOne({ where: { id } });
      if (!liveClass) {
        return sendResponse(res, 404, null, 'Live class not found');
      }

      // Handle file uploads
      if (file) {
        updateData.thumbnailUrl = `/uploads/${file.filename}`;
        console.log('Thumbnail image updated:', updateData.thumbnailUrl);
        console.log('Thumbnail image file details:', {
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size
        });
      }

      // Update live class
      Object.assign(liveClass, updateData);
      if (updateData.title && !updateData.slug) {
        liveClass.slug = updateData.title.toLowerCase().replace(/\s+/g, '-');
      }

      const updatedLiveClass = await liveClassRepository.save(liveClass);

      return sendResponse(res, 200, { liveClass: updatedLiveClass }, 'Live class updated successfully');
    } catch (error) {
      console.error('Error updating live class:', error);
      return sendResponse(res, 500, null, 'Failed to update live class');
    }
  }

  // Delete live class (admin only)
  static async deleteLiveClass(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const liveClass = await liveClassRepository.findOne({ where: { id } });
      if (!liveClass) {
        return sendResponse(res, 404, null, 'Live class not found');
      }

      await liveClassRepository.remove(liveClass);

      return sendResponse(res, 200, null, 'Live class deleted successfully');
    } catch (error) {
      console.error('Error deleting live class:', error);
      return sendResponse(res, 500, null, 'Failed to delete live class');
    }
  }

  // Publish/Unpublish live class (admin only)
  static async togglePublishStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;

      const liveClass = await liveClassRepository.findOne({ where: { id } });
      if (!liveClass) {
        return sendResponse(res, 404, null, 'Live class not found');
      }

      liveClass.isPublished = isPublished;

      const updatedLiveClass = await liveClassRepository.save(liveClass);

      const message = isPublished ? 'Live class published successfully' : 'Live class unpublished successfully';
      return sendResponse(res, 200, { liveClass: updatedLiveClass }, message);
    } catch (error) {
      console.error('Error toggling live class publish status:', error);
      return sendResponse(res, 500, null, 'Failed to update live class status');
    }
  }

  // Start live class (admin/instructor only)
  static async startLiveClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const liveClass = await liveClassRepository.findOne({ where: { id } });
      if (!liveClass) {
        return sendResponse(res, 404, null, 'Live class not found');
      }

      // Check if user is instructor or admin
      if (liveClass.instructorId !== userId && (req as any).user?.role !== 'admin') {
        return sendResponse(res, 403, null, 'Only instructor can start this live class');
      }

      liveClass.status = 'live';
      liveClass.startedAt = new Date();

      const updatedLiveClass = await liveClassRepository.save(liveClass);

      return sendResponse(res, 200, { liveClass: updatedLiveClass }, 'Live class started successfully');
    } catch (error) {
      console.error('Error starting live class:', error);
      return sendResponse(res, 500, null, 'Failed to start live class');
    }
  }

  // End live class (admin/instructor only)
  static async endLiveClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const liveClass = await liveClassRepository.findOne({ where: { id } });
      if (!liveClass) {
        return sendResponse(res, 404, null, 'Live class not found');
      }

      // Check if user is instructor or admin
      if (liveClass.instructorId !== userId && (req as any).user?.role !== 'admin') {
        return sendResponse(res, 403, null, 'Only instructor can end this live class');
      }

      liveClass.status = 'completed';
      liveClass.endedAt = new Date();

      const updatedLiveClass = await liveClassRepository.save(liveClass);

      return sendResponse(res, 200, { liveClass: updatedLiveClass }, 'Live class ended successfully');
    } catch (error) {
      console.error('Error ending live class:', error);
      return sendResponse(res, 500, null, 'Failed to end live class');
    }
  }

  // Get live class statistics (admin only)
  static async getLiveClassStats(req: Request, res: Response) {
    try {
      const totalLiveClasses = await liveClassRepository.count();
      const publishedLiveClasses = await liveClassRepository.count({ where: { isPublished: true } });
      const scheduledLiveClasses = await liveClassRepository.count({ where: { status: 'scheduled' } });
      const liveLiveClasses = await liveClassRepository.count({ where: { status: 'live' } });
      const completedLiveClasses = await liveClassRepository.count({ where: { status: 'completed' } });

      const stats = {
        totalLiveClasses,
        publishedLiveClasses,
        scheduledLiveClasses,
        liveLiveClasses,
        completedLiveClasses
      };

      return sendResponse(res, 200, { stats }, 'Live class statistics retrieved successfully');
    } catch (error) {
      console.error('Error fetching live class statistics:', error);
      return sendResponse(res, 500, null, 'Failed to fetch live class statistics');
    }
  }
}
