const express = require('express');
const router = express.Router();

// Import controllers
const adminController = require('../../controllers/adminController');

// Import middleware
const { authenticateToken, requireAdmin } = require('../../middlewares/auth');

// Admin API routes for admin panel
// All routes require admin authentication

// Dashboard
router.get('/dashboard', authenticateToken, requireAdmin, adminController.getDashboard);

// Users management
router.get('/users', authenticateToken, requireAdmin, adminController.getUsers);
router.get('/users/:id', authenticateToken, requireAdmin, adminController.getUserById);
router.put('/users/:id', authenticateToken, requireAdmin, adminController.updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, adminController.deleteUser);
router.put('/users/:id/status', authenticateToken, requireAdmin, adminController.updateUserStatus);

// Courses management
router.get('/courses', authenticateToken, requireAdmin, adminController.getCourses);
router.get('/courses/:id', authenticateToken, requireAdmin, adminController.getCourseById);
router.post('/courses', authenticateToken, requireAdmin, adminController.createCourse);
router.put('/courses/:id', authenticateToken, requireAdmin, adminController.updateCourse);
router.delete('/courses/:id', authenticateToken, requireAdmin, adminController.deleteCourse);
router.put('/courses/:id/status', authenticateToken, requireAdmin, adminController.updateCourseStatus);

// Books management
router.get('/books', authenticateToken, requireAdmin, adminController.getBooks);
router.get('/books/:id', authenticateToken, requireAdmin, adminController.getBookById);
router.post('/books', authenticateToken, requireAdmin, adminController.createBook);
router.put('/books/:id', authenticateToken, requireAdmin, adminController.updateBook);
router.delete('/books/:id', authenticateToken, requireAdmin, adminController.deleteBook);
router.put('/books/:id/status', authenticateToken, requireAdmin, adminController.updateBookStatus);

// Live Classes management
router.get('/live-classes', authenticateToken, requireAdmin, adminController.getLiveClasses);
router.get('/live-classes/:id', authenticateToken, requireAdmin, adminController.getLiveClassById);
router.post('/live-classes', authenticateToken, requireAdmin, adminController.createLiveClass);
router.put('/live-classes/:id', authenticateToken, requireAdmin, adminController.updateLiveClass);
router.delete('/live-classes/:id', authenticateToken, requireAdmin, adminController.deleteLiveClass);
router.put('/live-classes/:id/status', authenticateToken, requireAdmin, adminController.updateLiveClassStatus);

// Enrollments management
router.get('/enrollments', authenticateToken, requireAdmin, adminController.getEnrollments);
router.get('/enrollments/:id', authenticateToken, requireAdmin, adminController.getEnrollmentById);
router.put('/enrollments/:id/status', authenticateToken, requireAdmin, adminController.updateEnrollmentStatus);

// Analytics
router.get('/analytics/overview', authenticateToken, requireAdmin, adminController.getAnalyticsOverview);
router.get('/analytics/users', authenticateToken, requireAdmin, adminController.getUserAnalytics);
router.get('/analytics/courses', authenticateToken, requireAdmin, adminController.getCourseAnalytics);
router.get('/analytics/revenue', authenticateToken, requireAdmin, adminController.getRevenueAnalytics);

// Settings
router.get('/settings', authenticateToken, requireAdmin, adminController.getSettings);
router.put('/settings', authenticateToken, requireAdmin, adminController.updateSettings);

// Reports
router.get('/reports/users', authenticateToken, requireAdmin, adminController.generateUserReport);
router.get('/reports/courses', authenticateToken, requireAdmin, adminController.generateCourseReport);
router.get('/reports/revenue', authenticateToken, requireAdmin, adminController.generateRevenueReport);

module.exports = router;
