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
    serverless: true,
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

// Simple auth test route
app.post("/api/v1/auth/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth route is working ✅",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    vercel: !!process.env.VERCEL,
  });
});

// ----------------- Import Controllers and Middleware -----------------
let authController, adminController, mobileController, profileController, studentController;
let authenticateToken, requireAdmin, uploadFilesForBook;

try {
  console.log("🔧 Loading controllers...");
  
  // Load controllers with individual error handling
  try {
    authController = require("./controllers/authController");
    console.log("✅ Auth controller loaded");
  } catch (err) {
    console.error("❌ Failed to load authController:", err.message);
    throw err;
  }
  
  try {
    adminController = require("./controllers/adminController");
    console.log("✅ Admin controller loaded");
  } catch (err) {
    console.error("❌ Failed to load adminController:", err.message);
    throw err;
  }
  
  try {
    mobileController = require("./controllers/mobileController");
    console.log("✅ Mobile controller loaded");
  } catch (err) {
    console.error("❌ Failed to load mobileController:", err.message);
    throw err;
  }
  
  try {
    profileController = require("./controllers/profileController");
    console.log("✅ Profile controller loaded");
  } catch (err) {
    console.error("❌ Failed to load profileController:", err.message);
    throw err;
  }
  
  try {
    studentController = require("./controllers/studentController");
    console.log("✅ Student controller loaded");
  } catch (err) {
    console.error("❌ Failed to load studentController:", err.message);
    throw err;
  }
  
  try {
    const authMiddleware = require("./middlewares/auth");
    authenticateToken = authMiddleware.authenticateToken;
    console.log("✅ Auth middleware loaded");
  } catch (err) {
    console.error("❌ Failed to load auth middleware:", err.message);
    throw err;
  }
  
  try {
    const adminMiddleware = require("./middlewares/authMiddleware");
    requireAdmin = adminMiddleware.requireAdmin;
    console.log("✅ Admin middleware loaded");
  } catch (err) {
    console.error("❌ Failed to load admin middleware:", err.message);
    throw err;
  }
  
  try {
    uploadFilesForBook = adminController.uploadFilesForBook;
    console.log("✅ Upload middleware loaded");
  } catch (err) {
    console.error("❌ Failed to load upload middleware:", err.message);
    throw err;
  }

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
  app.get("/api/v1/admin/dashboard/stats", authenticateToken, requireAdmin, adminController.getDashboardStats);
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
  // Public routes (no authentication required)
  app.get("/api/v1/mobile/courses", mobileController.getCourses);
  app.get("/api/v1/mobile/books", mobileController.getBooks);
  app.get("/api/v1/mobile/live-classes", mobileController.getLiveClasses);
  app.get("/api/v1/mobile/course/:id", mobileController.getCourseById);
  app.get("/api/v1/mobile/book/:id", mobileController.getBookById);
  app.get("/api/v1/mobile/live-class/:id", mobileController.getLiveClassById);
  
  // Protected routes (authentication required)
  app.post("/api/v1/mobile/course/:id/enroll", authenticateToken, mobileController.enrollInCourse);
  app.post("/api/v1/mobile/book/:id/purchase", authenticateToken, mobileController.purchaseBook);
  app.post("/api/v1/mobile/live-class/:id/enroll", authenticateToken, mobileController.enrollInLiveClass);
  app.get("/api/v1/mobile/my-courses", authenticateToken, mobileController.getMyCourses);
  app.get("/api/v1/mobile/my-books", authenticateToken, mobileController.getMyBooks);
  app.get("/api/v1/mobile/my-live-classes", authenticateToken, mobileController.getMyLiveClasses);
  app.get("/api/v1/mobile/course/:courseId/progress", authenticateToken, mobileController.getCourseProgress);
  app.put("/api/v1/mobile/course/:courseId/progress", authenticateToken, mobileController.updateCourseProgress);
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
  
  // Fallback: Register basic routes even if controllers fail
  console.log("🔧 Setting up fallback routes...");
  
  // Basic auth fallback routes with working authentication
  app.post("/api/v1/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Email and password are required',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if it's the hardcoded admin user
      if (email === 'dc2006089@gmail.com' && password === 'Myname*321') {
        const { generateAccessToken, generateRefreshToken } = require('./utils/jwt');
        
        const userPayload = {
          id: 1,
          email: email,
          name: 'Admin User',
          role: 'admin',
          isAdmin: true,
          is_admin: true,
          email_verified: true,
          is_active: true
        };
        
        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
        
        res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              ...userPayload,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            tokens: {
              accessToken: accessToken,
              refreshToken: refreshToken,
              expiresIn: 3600
            }
          },
          timestamp: new Date().toISOString()
        });
      } else if (email === 'test@example.com' && password === 'password123') {
        const { generateAccessToken, generateRefreshToken } = require('./utils/jwt');
        
        const userPayload = {
          id: 2,
          email: email,
          name: 'Test User',
          role: 'user',
          isAdmin: false,
          is_admin: false,
          email_verified: true,
          is_active: true
        };
        
        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
        
        res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              ...userPayload,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            tokens: {
              accessToken: accessToken,
              refreshToken: refreshToken,
              expiresIn: 3600
            }
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Fallback login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  app.post("/api/v1/auth/register", (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Registration temporarily unavailable - database not connected',
      timestamp: new Date().toISOString()
    });
  });
  
  // Basic mobile fallback routes
  app.get("/api/v1/mobile/courses", (req, res) => {
    res.status(500).json({
      success: false,
      message: "Controller not loaded - server error",
      timestamp: new Date().toISOString()
    });
  });
  
  console.log("⚠️ Fallback routes registered");
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
