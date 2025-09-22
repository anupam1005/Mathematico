// Backend server for Mathematico Mobile App
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

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
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "favicon.ico"), err => {
    if (err) res.status(204).end(); // No Content if missing
  });
});

app.get("/robots.txt", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "robots.txt"), err => {
    if (err) res.status(204).end();
  });
});

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

// Test route to verify API routing works
app.get("/api/v1/test", (req, res) => {
  res.json({
    success: true,
    message: "API routing is working ✅",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    vercel: !!process.env.VERCEL,
  });
});

// ----------------- Import Controllers and Middleware -----------------
try {
  console.log("🔧 Loading controllers...");
  const authController = require("./controllers/authController");
  console.log("✅ Auth controller loaded");
  const adminController = require("./controllers/adminController");
  console.log("✅ Admin controller loaded");
  const mobileController = require("./controllers/mobileController");
  console.log("✅ Mobile controller loaded");
  const profileController = require("./controllers/profileController");
  console.log("✅ Profile controller loaded");
  const studentController = require("./controllers/studentController");
  console.log("✅ Student controller loaded");
  const { authenticateToken } = require("./middlewares/auth");
  console.log("✅ Auth middleware loaded");
  const { requireAdmin } = require("./middlewares/authMiddleware");
  console.log("✅ Admin middleware loaded");
  const { uploadFilesForBook } = require("./controllers/adminController");
  console.log("✅ Upload middleware loaded");

  // ----------------- Auth Routes -----------------
  app.post("/api/v1/auth/login", authController.login);
  app.post("/api/v1/auth/register", authController.register);
  app.post("/api/v1/auth/logout", authController.logout);
  app.post("/api/v1/auth/refresh", authController.refreshToken);
  app.post("/api/v1/auth/forgot-password", authController.forgotPassword);
  app.post("/api/v1/auth/reset-password", authController.resetPassword);
  app.post("/api/v1/auth/verify-email", authController.verifyEmail);
  app.get("/api/v1/auth/profile", authenticateToken, authController.getProfile);

  // ----------------- Admin Routes -----------------
  app.get("/api/v1/admin/users", authenticateToken, requireAdmin, adminController.getUsers);
  app.get("/api/v1/admin/courses", authenticateToken, requireAdmin, adminController.getCourses);
  app.get("/api/v1/admin/course/:id", authenticateToken, requireAdmin, adminController.getCourseById);
  app.post("/api/v1/admin/courses", authenticateToken, requireAdmin, adminController.createCourse);
  app.put("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, adminController.updateCourse);
  app.delete("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, adminController.deleteCourse);
  app.put("/api/v1/admin/courses/:id/status", authenticateToken, requireAdmin, adminController.updateCourseStatus);
  app.get("/api/v1/admin/books", authenticateToken, requireAdmin, adminController.getBooks);
  app.get("/api/v1/admin/book/:id", authenticateToken, requireAdmin, adminController.getBookById);
  app.post("/api/v1/admin/books", authenticateToken, requireAdmin, uploadFilesForBook, adminController.createBook);
  app.put("/api/v1/admin/books/:id", authenticateToken, requireAdmin, uploadFilesForBook, adminController.updateBook);
  app.delete("/api/v1/admin/books/:id", authenticateToken, requireAdmin, adminController.deleteBook);
  app.put("/api/v1/admin/books/:id/status", authenticateToken, requireAdmin, adminController.updateBookStatus);
  app.get("/api/v1/admin/live-classes", authenticateToken, requireAdmin, adminController.getLiveClasses);
  app.get("/api/v1/admin/live-class/:id", authenticateToken, requireAdmin, adminController.getLiveClassById);
  app.post("/api/v1/admin/live-classes", authenticateToken, requireAdmin, adminController.createLiveClass);
  app.put("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, adminController.updateLiveClass);
  app.delete("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, adminController.deleteLiveClass);
  app.put("/api/v1/admin/live-classes/:id/status", authenticateToken, requireAdmin, adminController.updateLiveClassStatus);

  // ----------------- Student Routes -----------------
  app.get("/api/v1/student/dashboard", authenticateToken, studentController.getDashboard);
  app.get("/api/v1/student/courses", authenticateToken, studentController.getCourses);
  app.get("/api/v1/student/course/:id", authenticateToken, studentController.getCourseById);
  app.post("/api/v1/student/course/:id/enroll", authenticateToken, studentController.enrollInCourse);
  app.get("/api/v1/student/books", authenticateToken, studentController.getBooks);
  app.get("/api/v1/student/book/:id", authenticateToken, studentController.getBookById);
  app.post("/api/v1/student/book/:id/purchase", authenticateToken, studentController.purchaseBook);
  app.get("/api/v1/student/live-classes", authenticateToken, studentController.getLiveClasses);
  app.get("/api/v1/student/live-class/:id", authenticateToken, studentController.getLiveClassById);
  app.post("/api/v1/student/live-class/:id/enroll", authenticateToken, studentController.enrollInLiveClass);
  app.get("/api/v1/student/course/:courseId/progress", authenticateToken, studentController.getCourseProgress);
  app.put("/api/v1/student/course/:courseId/progress", authenticateToken, studentController.updateCourseProgress);
  app.get("/api/v1/student/notifications", authenticateToken, studentController.getNotifications);
  app.put("/api/v1/student/notifications/:id/read", authenticateToken, studentController.markNotificationAsRead);

  // ----------------- Mobile Routes -----------------
  app.get("/api/v1/mobile/courses", mobileController.getCourses);
  app.get("/api/v1/mobile/books", mobileController.getBooks);
  app.get("/api/v1/mobile/live-classes", mobileController.getLiveClasses);
  app.get("/api/v1/mobile/course/:id", mobileController.getCourseById);
  app.get("/api/v1/mobile/book/:id", mobileController.getBookById);
  app.get("/api/v1/mobile/live-class/:id", mobileController.getLiveClassById);
  app.post("/api/v1/mobile/course/:id/enroll", mobileController.enrollInCourse);
  app.post("/api/v1/mobile/book/:id/purchase", mobileController.purchaseBook);
  app.post("/api/v1/mobile/live-class/:id/enroll", mobileController.enrollInLiveClass);
  app.get("/api/v1/mobile/my-courses", mobileController.getMyCourses);
  app.get("/api/v1/mobile/my-books", mobileController.getMyBooks);
  app.get("/api/v1/mobile/my-live-classes", mobileController.getMyLiveClasses);
  app.get("/api/v1/mobile/course/:courseId/progress", mobileController.getCourseProgress);
  app.put("/api/v1/mobile/course/:courseId/progress", mobileController.updateCourseProgress);
  app.get("/api/v1/mobile/notifications", mobileController.getNotifications);
  app.put("/api/v1/mobile/notifications/:id/read", mobileController.markNotificationAsRead);

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
  app.get("/api/v1/profile/activity/recent", authenticateToken, profileController.getRecentActivity);

  console.log("✅ All routes registered successfully");
} catch (err) {
  console.error("❌ Route setup failed:", err);
  console.error("❌ Error stack:", err.stack);
  console.error("❌ Error details:", {
    message: err.message,
    name: err.name,
    code: err.code
  });
}

// Initialize database connection (non-blocking)
const { testConnection, createUsersTable, createBooksTable, createCoursesTable, createLiveClassesTable } = require("./database");

// Initialize database asynchronously (non-blocking)
(async () => {
  try {
    console.log("🔧 Initializing database...");
    const isConnected = await testConnection();
    if (isConnected) {
      console.log("✅ Database connected successfully");
      await createUsersTable();
      await createBooksTable();
      await createCoursesTable();
      await createLiveClassesTable();
      console.log("✅ Database tables initialized");
    } else {
      console.log("⚠️ Database connection failed, using fallback mode");
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    console.log("⚠️ Continuing with fallback mode");
  }
})();

// ----------------- 404 & Error Handler -----------------
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error("🔥 Global error:", err);
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
    console.log(`✅ Server running on port ${PORT}`);
  });
}

module.exports = app;
