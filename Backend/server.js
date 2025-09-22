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

// ----------------- Import routes dynamically -----------------
try {
  const authController = require("./controllers/authController");
  const adminController = require("./controllers/adminController");
  const mobileController = require("./controllers/mobileController");
  const profileController = require("./controllers/profileController");
  const studentController = require("./controllers/studentController");
  const { authenticateToken } = require("./middlewares/auth");
  const { requireAdmin } = require("./middlewares/authMiddleware");
  const { uploadFilesForBook } = require("./controllers/adminController");

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
  app.post("/api/v1/admin/courses", authenticateToken, requireAdmin, adminController.createCourse);
  app.put("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, adminController.updateCourse);
  app.delete("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, adminController.deleteCourse);
  app.get("/api/v1/admin/books", authenticateToken, requireAdmin, adminController.getBooks);
  app.post("/api/v1/admin/books", authenticateToken, requireAdmin, uploadFilesForBook, adminController.createBook);
  app.put("/api/v1/admin/books/:id", authenticateToken, requireAdmin, uploadFilesForBook, adminController.updateBook);
  app.delete("/api/v1/admin/books/:id", authenticateToken, requireAdmin, adminController.deleteBook);
  app.get("/api/v1/admin/live-classes", authenticateToken, requireAdmin, adminController.getLiveClasses);
  app.post("/api/v1/admin/live-classes", authenticateToken, requireAdmin, adminController.createLiveClass);
  app.put("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, adminController.updateLiveClass);
  app.delete("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, adminController.deleteLiveClass);

  // ----------------- Student Routes -----------------
  app.get("/api/v1/student/dashboard", authenticateToken, studentController.getDashboard);
  app.get("/api/v1/student/courses", authenticateToken, studentController.getCourses);
  app.get("/api/v1/student/books", authenticateToken, studentController.getBooks);
  app.get("/api/v1/student/live-classes", authenticateToken, studentController.getLiveClasses);

  // ----------------- Mobile Routes -----------------
  app.get("/api/v1/mobile/courses", mobileController.getCourses);
  app.get("/api/v1/mobile/books", mobileController.getBooks);
  app.get("/api/v1/mobile/live-classes", mobileController.getLiveClasses);
  app.get("/api/v1/mobile/course/:id", mobileController.getCourseById);
  app.get("/api/v1/mobile/book/:id", mobileController.getBookById);
  app.get("/api/v1/mobile/live-class/:id", mobileController.getLiveClassById);

  // ----------------- Profile Routes -----------------
  app.get("/api/v1/profile", authenticateToken, profileController.getProfile);
  app.put("/api/v1/profile", authenticateToken, profileController.updateProfile);
  app.put("/api/v1/profile/password", authenticateToken, profileController.changePassword);

  console.log("✅ All routes registered successfully");
} catch (err) {
  console.error("❌ Route setup failed:", err.message);
}

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
