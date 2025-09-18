import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { CourseController } from '../controllers/course.controller';

const router = Router();
const courseController = new CourseController();

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes (require authentication)
router.use(authenticate);

// Enroll in a course
router.post('/:id/enroll', courseController.enrollInCourse);

// Get user's enrolled courses
router.get('/my-courses', courseController.getMyCourses);

// Instructor/Admin routes (admin only for simplicity)
router.use(isAdmin);

// Create a new course
router.post('/', courseController.createCourse);

// Update a course
router.patch('/:id', courseController.updateCourse);

// Delete a course
router.delete('/:id', courseController.deleteCourse);

// Add module to course
router.post('/:id/modules', courseController.addModule);

// Update module
router.patch('/:id/modules/:moduleId', courseController.updateModule);

// Delete module
router.delete('/:id/modules/:moduleId', courseController.deleteModule);

// Add lesson to module
router.post('/:id/modules/:moduleId/lessons', courseController.addLesson);

// Update lesson
router.patch('/:id/modules/:moduleId/lessons/:lessonId', courseController.updateLesson);

// Delete lesson
router.delete('/:id/modules/:moduleId/lessons/:lessonId', courseController.deleteLesson);

// Admin routes (admin only)
router.use(isAdmin);

// Get all courses (including unpublished ones)
router.get('/admin/all', courseController.adminGetAllCourses);

// Publish/Unpublish course
router.patch('/:id/publish', courseController.togglePublishStatus);

export default router;
