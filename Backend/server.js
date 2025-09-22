// Backend server for Mathematico Mobile App
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

// Controllers
const authController = require("./controllers/authController");
const adminController = require("./controllers/adminController");
const mobileController = require("./controllers/mobileController");
const profileController = require("./controllers/profileController");
const studentController = require("./controllers/studentController");

// Middlewares
const { authenticateToken } = require("./middlewares/auth");
const { requireAdmin } = require("./middlewares/authMiddleware");
const { uploadFilesForBook } = require("./controllers/adminController");

const app = express();

// ----------------- Security -----------------
app.use(helmet({ contentSecurityPolicy: false }));

// ----------------- CORS -----------------
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// ----------------- Body Parsers -----------------
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ----------------- Static -----------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// ----------------- Favicon & Robots -----------------
app.get("/favicon.ico", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "favicon.ico"))
);

app.get("/robots.txt", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "robots.txt"))
);

// ----------------- Root & Health -----------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API is running ✅",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    vercel: !!process.env.VERCEL,
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API is healthy ✅",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    vercel: !!process.env.VERCEL,
  });
});

// ----------------- Auth Routes -----------------
app.post("/api/v1/auth/login", authController.login);
app.post("/api/v1/auth/register", authController.register);
app.post("/api/v1/auth/logout", authController.logout);
app.post("/api/v1/auth/refresh-token", authController.refreshToken);
app.post("/api/v1/auth/forgot-password", authController.forgotPassword);
app.post("/api/v1/auth/reset-password", authController.resetPassword);
app.post("/api/v1/auth/verify-email", authController.verifyEmail);
app.get("/api/v1/auth/profile", authenticateToken, authController.getProfile);

// ----------------- Admin Routes -----------------
app.get("/api/v1/admin/books", authenticateToken, requireAdmin, adminController.getBooks);
app.get("/api/v1/admin/books/:id", authenticateToken, requireAdmin, adminController.getBookById);
app.post("/api/v1/admin/books", authenticateToken, requireAdmin, uploadFilesForBook, adminController.createBook);
app.put("/api/v1/admin/books/:id", authenticateToken, requireAdmin, adminController.updateBook);
app.delete("/api/v1/admin/books/:id", authenticateToken, requireAdmin, adminController.deleteBook);
app.put("/api/v1/admin/books/:id/toggle-publish", authenticateToken, requireAdmin, adminController.updateBookStatus);

app.get("/api/v1/admin/courses", authenticateToken, requireAdmin, adminController.getCourses);
app.post("/api/v1/admin/courses", authenticateToken, requireAdmin, adminController.createCourse);
app.get("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, adminController.getCourseById);
app.put("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, adminController.updateCourse);
app.delete("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, adminController.deleteCourse);
app.put("/api/v1/admin/courses/:id/status", authenticateToken, requireAdmin, adminController.updateCourseStatus);

app.get("/api/v1/admin/live-classes", authenticateToken, requireAdmin, adminController.getLiveClasses);
app.post("/api/v1/admin/live-classes", authenticateToken, requireAdmin, adminController.createLiveClass);
app.get("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, adminController.getLiveClassById);
app.put("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, adminController.updateLiveClass);
app.delete("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, adminController.deleteLiveClass);
app.put("/api/v1/admin/live-classes/:id/toggle-publish", authenticateToken, requireAdmin, adminController.updateLiveClassStatus);

app.get("/api/v1/admin/users", authenticateToken, requireAdmin, adminController.getUsers);

// ----------------- Student Routes -----------------
app.get("/api/v1/student/dashboard", authenticateToken, studentController.getDashboard);
app.get("/api/v1/student/courses", authenticateToken, studentController.getCourses);
app.get("/api/v1/student/courses/:id", authenticateToken, studentController.getCourseById);
app.post("/api/v1/student/courses/:id/enroll", authenticateToken, studentController.enrollInCourse);
app.get("/api/v1/student/books", authenticateToken, studentController.getBooks);
app.get("/api/v1/student/books/:id", authenticateToken, studentController.getBookById);
app.post("/api/v1/student/books/:id/purchase", authenticateToken, studentController.purchaseBook);
app.get("/api/v1/student/live-classes", authenticateToken, studentController.getLiveClasses);
app.get("/api/v1/student/live-classes/:id", authenticateToken, studentController.getLiveClassById);
app.post("/api/v1/student/live-classes/:id/enroll", authenticateToken, studentController.enrollInLiveClass);
app.get("/api/v1/student/courses/:courseId/progress", authenticateToken, studentController.getCourseProgress);
app.put("/api/v1/student/courses/:courseId/progress", authenticateToken, studentController.updateCourseProgress);
app.get("/api/v1/student/notifications", authenticateToken, studentController.getNotifications);
app.put("/api/v1/student/notifications/:id/read", authenticateToken, studentController.markNotificationAsRead);

// ----------------- Mobile Routes -----------------
app.get("/api/v1/mobile/courses", mobileController.getCourses);
app.get("/api/v1/mobile/courses/:id", mobileController.getCourseById);
app.post("/api/v1/mobile/courses/:id/enroll", authenticateToken, mobileController.enrollInCourse);
app.get("/api/v1/mobile/books", mobileController.getBooks);
app.get("/api/v1/mobile/books/:id", mobileController.getBookById);
app.post("/api/v1/mobile/books/:id/purchase", authenticateToken, mobileController.purchaseBook);
app.get("/api/v1/mobile/live-classes", mobileController.getLiveClasses);
app.get("/api/v1/mobile/live-classes/:id", mobileController.getLiveClassById);
app.post("/api/v1/mobile/live-classes/:id/enroll", authenticateToken, mobileController.enrollInLiveClass);
app.get("/api/v1/mobile/my-courses", authenticateToken, mobileController.getMyCourses);
app.get("/api/v1/mobile/my-books", authenticateToken, mobileController.getMyBooks);
app.get("/api/v1/mobile/my-live-classes", authenticateToken, mobileController.getMyLiveClasses);
app.get("/api/v1/mobile/courses/:courseId/progress", authenticateToken, mobileController.getCourseProgress);
app.put("/api/v1/mobile/courses/:courseId/progress", authenticateToken, mobileController.updateCourseProgress);
app.get("/api/v1/mobile/notifications", authenticateToken, mobileController.getNotifications);
app.put("/api/v1/mobile/notifications/:id/read", authenticateToken, mobileController.markNotificationAsRead);

// ----------------- Profile Routes -----------------
app.get("/api/v1/profile", authenticateToken, profileController.getProfile);
app.put("/api/v1/profile", authenticateToken, profileController.updateProfile);
app.put("/api/v1/profile/password", authenticateToken, profileController.changePassword);
app.put("/api/v1/profile/avatar", authenticateToken, profileController.updateAvatar);
app.get("/api/v1/profile/preferences", authenticateToken, profileController.getPreferences);
app.put("/api/v1/profile/preferences", authenticateToken, profileController.updatePreferences);
app.get("/api/v1/profile/notifications", authenticateToken, profileController.getNotifications);
app.put("/api/v1/profile/notifications/:id/read", authenticateToken, profileController.markNotificationAsRead);
app.put("/api/v1/profile/notifications/read-all", authenticateToken, profileController.markAllNotificationsAsRead);
app.get("/api/v1/profile/activity", authenticateToken, profileController.getActivity);
app.get("/api/v1/profile/recent-activity", authenticateToken, profileController.getRecentActivity);

// ----------------- Public Routes -----------------
app.get("/api/v1/books", (req, res) =>
  res.json({ success: true, data: [], message: "Books retrieved successfully" })
);
app.get("/api/v1/courses", (req, res) =>
  res.json({ success: true, data: [], message: "Courses retrieved successfully" })
);
app.get("/api/v1/live-classes", (req, res) =>
  res.json({ success: true, data: [], message: "Live classes retrieved successfully" })
);

// ----------------- 404 & Error Handler -----------------
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ----------------- Export for Vercel -----------------
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
