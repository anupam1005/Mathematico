import { Request, Response } from 'express';
// Importing only what's needed
import { JwtPayload as TokenPayload } from '../utils/new-jwt';
import { CourseRepository } from '../repositories/course.repository';
import { User } from '../entities/User';

export class CourseController {
  private courseRepository: CourseRepository;

  constructor() {
    this.courseRepository = new CourseRepository();
  }

  // Get all courses (only published courses for normal users)
  getAllCourses = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      // Use query builder to ensure all fields including thumbnailUrl are selected
      const queryBuilder = this.courseRepository.getRepository()
        .createQueryBuilder('course')
        .leftJoinAndSelect('course.instructor', 'instructor')
        .where('course.isPublished = :isPublished', { isPublished: true })
        .andWhere('course.status = :status', { status: 'active' })
        .orderBy('course.createdAt', 'DESC')
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit));
      
      const [courses, total] = await queryBuilder.getManyAndCount();
      
      console.log(`Found ${courses.length} published courses`);
      console.log('Sample course thumbnailUrl:', courses[0]?.thumbnailUrl);
      
      return res.json({
        data: courses,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      return res.status(500).json({ message: 'Error fetching courses' });
    }
  };

  // Get course by ID (only published courses for normal users)
  getCourseById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const course = await this.courseRepository.findPublishedCourseById(id);

      if (!course) {
        return res.status(404).json({ message: 'Course not found or not published' });
      }

      return res.json(course);
    } catch (error) {
      console.error('Error fetching course:', error);
      return res.status(500).json({ message: 'Error fetching course' });
    }
  };

  // Create a new course
  createCourse = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const user = req.user as TokenPayload;
      const courseData = {
        ...req.body,
        instructor: { id: user.id } as User, // Only pass the user ID
      };

      const course = await this.courseRepository.create(courseData);
      return res.status(201).json(course);
    } catch (error) {
      console.error('Error creating course:', error);
      return res.status(500).json({ message: 'Error creating course' });
    }
  };

  // Enroll in a course
  enrollInCourse = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { id: courseId } = req.params;
      const user = req.user as TokenPayload;

      // Check if course exists and is published
      const course = await this.courseRepository.findPublishedCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found or not published' });
      }

      // Check if already enrolled
      const isEnrolled = await this.courseRepository.isUserEnrolled(user.id, courseId);
      if (isEnrolled) {
        return res.status(400).json({ message: 'Already enrolled in this course' });
      }

      await this.courseRepository.enrollUser(user.id, courseId);
      return res.status(201).json({ message: 'Successfully enrolled in course' });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      return res.status(500).json({ message: 'Error enrolling in course' });
    }
  };

  // Get user's enrolled courses
  getMyCourses = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const user = req.user as TokenPayload;
      const { page = 1, limit = 10 } = req.query;

      const [enrollments, total] = await this.courseRepository.findUserEnrollments(
        user.id,
        Number(page),
        Number(limit)
      );

      return res.json({
        data: enrollments.map((enrollment: any) => enrollment.course),
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching user courses:', error);
      return res.status(500).json({ message: 'Error fetching your courses' });
    }
  };

  // Update a course
  updateCourse = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const user = req.user as TokenPayload;
      const updateData = req.body;

      // Check if course exists and user is the instructor
      const course = await this.courseRepository.findOne({
        where: { id },
        relations: ['instructor'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Only the instructor or admin can update the course
      if (course.instructor.id !== user.id && !user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Not authorized to update this course' });
      }

      const updatedCourse = await this.courseRepository.update(id, updateData);
      return res.json(updatedCourse);
    } catch (error) {
      console.error('Error updating course:', error);
      return res.status(500).json({ message: 'Error updating course' });
    }
  };

  // Delete a course
  deleteCourse = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const user = req.user as TokenPayload;

      // Check if course exists and user is the instructor or admin
      const course = await this.courseRepository.findOne({
        where: { id },
        relations: ['instructor'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Only the instructor or admin can delete the course
      if (course.instructor.id !== user.id && !user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Not authorized to delete this course' });
      }

      await this.courseRepository.delete(id);
      return res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      console.error('Error deleting course:', error);
      return res.status(500).json({ message: 'Error deleting course' });
    }
  };

  // Add module to course
  addModule = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id: courseId } = req.params;
      const user = req.user as TokenPayload;
      const moduleData = req.body;

      // Check if course exists and user is the instructor
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['instructor'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Only the instructor or admin can add a module
      if (course.instructor.id !== user.id && !user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Not authorized to add modules to this course' });
      }

      const newModule = await this.courseRepository.addModule(courseId, moduleData);
      return res.status(201).json(newModule);
    } catch (error) {
      console.error('Error adding module:', error);
      return res.status(500).json({ message: 'Error adding module' });
    }
  };

  // Update module
  updateModule = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { moduleId } = req.params;
      const user = req.user as TokenPayload;
      const updateData = req.body;

      // Check if module exists and user is the instructor
      const module = await this.courseRepository.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }

      const course = await this.courseRepository.findOne({
        where: { id: module.courseId },
        relations: ['instructor'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Only the instructor or admin can update the module
      if (course.instructor.id !== user.id && !user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Not authorized to update this module' });
      }

      const updatedModule = await this.courseRepository.updateModule(moduleId, updateData);
      return res.json(updatedModule);
    } catch (error) {
      console.error('Error updating module:', error);
      return res.status(500).json({ message: 'Error updating module' });
    }
  };

  // Delete module
  deleteModule = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { moduleId } = req.params;
      const user = req.user as TokenPayload;

      // Check if module exists and user is the instructor
      const module = await this.courseRepository.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }

      const course = await this.courseRepository.findOne({
        where: { id: module.courseId },
        relations: ['instructor'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Only the instructor or admin can delete the module
      if (course.instructor.id !== user.id && !user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Not authorized to delete this module' });
      }

      await this.courseRepository.deleteModule(moduleId);
      return res.json({ message: 'Module deleted successfully' });
    } catch (error) {
      console.error('Error deleting module:', error);
      return res.status(500).json({ message: 'Error deleting module' });
    }
  };

  // Add lesson to module
  addLesson = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { moduleId } = req.params;
      const user = req.user as TokenPayload;
      const lessonData = req.body;

      // Check if module exists and user is the instructor
      const module = await this.courseRepository.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }

      const course = await this.courseRepository.findOne({
        where: { id: module.courseId },
        relations: ['instructor'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Only the instructor or admin can add a lesson
      if (course.instructor.id !== user.id && !user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Not authorized to add lessons to this module' });
      }

      const newLesson = await this.courseRepository.addLesson(moduleId, lessonData);
      return res.status(201).json(newLesson);
    } catch (error) {
      console.error('Error adding lesson:', error);
      return res.status(500).json({ message: 'Error adding lesson' });
    }
  };

  // Update lesson
  updateLesson = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { lessonId } = req.params;
      const user = req.user as TokenPayload;
      const updateData = req.body;

      // Check if lesson exists and user is the instructor
      const lesson = await this.courseRepository.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      const module = await this.courseRepository.getModule(lesson.moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }

      const course = await this.courseRepository.findOne({
        where: { id: module.courseId },
        relations: ['instructor'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Only the instructor or admin can update the lesson
      if (course.instructor.id !== user.id && !user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Not authorized to update this lesson' });
      }

      const updatedLesson = await this.courseRepository.updateLesson(lessonId, updateData);
      return res.json(updatedLesson);
    } catch (error) {
      console.error('Error updating lesson:', error);
      return res.status(500).json({ message: 'Error updating lesson' });
    }
  };

  // Delete lesson
  deleteLesson = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { lessonId } = req.params;
      const user = req.user as TokenPayload;

      // Check if lesson exists and user is the instructor
      const lesson = await this.courseRepository.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      const module = await this.courseRepository.getModule(lesson.moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }

      const course = await this.courseRepository.findOne({
        where: { id: module.courseId },
        relations: ['instructor'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Only the instructor or admin can delete the lesson
      if (course.instructor.id !== user.id && !user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Not authorized to delete this lesson' });
      }

      await this.courseRepository.deleteLesson(lessonId);
      return res.json({ message: 'Lesson deleted successfully' });
    } catch (error) {
      console.error('Error deleting lesson:', error);
      return res.status(500).json({ message: 'Error deleting lesson' });
    }
  };

  // Admin: Get all courses (including unpublished ones)
  adminGetAllCourses = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { page = 1, limit = 10 } = req.query;
      const [courses, total] = await this.courseRepository.findAndCount({
        withDeleted: true, // Include soft-deleted courses
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });
      
      return res.json({
        data: courses,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching all courses (admin):', error);
      return res.status(500).json({ message: 'Error fetching all courses' });
    }
  };

  // Toggle course publish status
  togglePublishStatus = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const user = req.user as TokenPayload;
      
      // Check if course exists and user is admin
      const course = await this.courseRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Only admin can toggle publish status
      if (!user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Not authorized to update publish status' });
      }

      const newPublishStatus = !course.isPublished;
      await this.courseRepository.update(id, {
        isPublished: newPublishStatus,
      });

      // Fetch the updated course to get the current state
      const updatedCourse = await this.courseRepository.findOne({
        where: { id },
      });

      if (!updatedCourse) {
        return res.status(404).json({ message: 'Course not found after update' });
      }

      return res.json({
        message: `Course ${updatedCourse.isPublished ? 'published' : 'unpublished'} successfully`,
        isPublished: updatedCourse.isPublished,
      });
    } catch (error) {
      console.error('Error toggling course publish status:', error);
      return res.status(500).json({ message: 'Error toggling course publish status' });
    }
  };
}
