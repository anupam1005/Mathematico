// Vercel serverless backend entry point for Mathematico
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const rateLimit = require("express-rate-limit");

const { generateAccessToken, generateRefreshToken } = require("./utils/jwt");
const { authenticateToken, requireAdmin } = require("./middlewares/auth");
const { Book, testConnection, createUsersTable, createBooksTable, createCoursesTable, createLiveClassesTable } = require("./database");

const app = express();

// Middleware
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || "*", 
  credentials: true 
}));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later."
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = './uploads/temp';
    
    if (file.fieldname === 'coverImage' || file.fieldname === 'image') {
      uploadPath = './uploads/covers';
    } else if (file.fieldname === 'pdfFile' || file.fieldname === 'pdf') {
      uploadPath = './uploads/pdfs';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'coverImage' || file.fieldname === 'image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for cover images'), false);
      }
    } else if (file.fieldname === 'pdfFile' || file.fieldname === 'pdf') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// Initialize database on startup
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('📊 Creating database tables...');
      await createUsersTable();
      await createBooksTable();
      await createCoursesTable();
      await createLiveClassesTable();
      console.log('✅ Database initialization complete');
    } else {
      console.log('⚠️ Database connection failed, using fallback mode');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Initialize database
initializeDatabase();

// ----------------- Root & Health -----------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API is running ✅",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    serverless: true,
  });
});

app.get("/api/v1", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API v1 is running ✅",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    serverless: true,
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API is healthy ✅",
    timestamp: new Date().toISOString(),
  });
});

// ----------------- AUTH ROUTES -----------------
app.post("/api/v1/auth/login", authLimiter, (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    let userPayload;
    if (email === "dc2006089@gmail.com" && password === "Myname*321") {
      userPayload = {
        id: 1,
        email,
        name: "Admin User",
        role: "admin",
        isAdmin: true,
      };
    } else if (email === "test@example.com" && password === "password123") {
      userPayload = {
        id: 2,
        email,
        name: "Test User",
        role: "user",
        isAdmin: false,
      };
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userPayload.id });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          ...userPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.post("/api/v1/auth/register", authLimiter, (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const userPayload = {
      id: Date.now(),
      name,
      email,
      role: "user",
      isAdmin: false,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userPayload.id });

    res.json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          ...userPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        tokens: { accessToken, refreshToken, expiresIn: 3600 },
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// ----------------- MOBILE ROUTES -----------------
app.get("/api/v1/mobile/courses", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: "Advanced Mathematics",
        description: "Comprehensive course covering advanced mathematical concepts",
        category: "Mathematics",
        level: "Advanced",
        price: 99.99,
        status: "active",
      },
    ],
  });
});

app.get("/api/v1/mobile/books", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: "Advanced Calculus Textbook",
        author: "Dr. John Smith",
        category: "Mathematics",
        status: "active",
      },
    ],
  });
});

app.get("/api/v1/mobile/live-classes", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: "Advanced Calculus Live Session",
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        status: "scheduled",
      },
    ],
  });
});

// ----------------- ADMIN ROUTES (Protected with JWT) -----------------
app.get("/api/v1/admin/dashboard", authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      totalCourses: 25,
      totalBooks: 40,
      totalLiveClasses: 12,
      totalRevenue: 125000,
    },
  });
});

// Books - Protected routes
app.get("/api/v1/admin/books", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const result = await Book.getAll(parseInt(page), parseInt(limit), category, search);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch books"
    });
  }
});

app.post("/api/v1/admin/books", authenticateToken, requireAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, author, description, category, pages, isbn, status } = req.body;
    
    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: "Title and author are required"
      });
    }

    const bookData = {
      title,
      author,
      description: description || "",
      category: category || "Mathematics",
      pages: parseInt(pages) || 0,
      isbn: isbn || "",
      status: status || "draft",
      is_published: false,
      cover_image_url: req.files?.coverImage ? `/uploads/covers/${req.files.coverImage[0].filename}` : null,
      pdf_url: req.files?.pdfFile ? `/uploads/pdfs/${req.files.pdfFile[0].filename}` : null
    };

    const createdBook = await Book.create(bookData);

    res.json({
      success: true,
      message: "Book created successfully",
      data: createdBook
    });
  } catch (error) {
    console.error("Book creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create book"
    });
  }
});

app.put("/api/v1/admin/books/:id", authenticateToken, requireAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, description, category, pages, isbn, status } = req.body;
    
    const bookData = {
      title: title || "Updated Book",
      author: author || "Unknown Author",
      description: description || "",
      category: category || "Mathematics",
      pages: parseInt(pages) || 0,
      isbn: isbn || "",
      status: status || "draft",
      is_published: false
    };

    // Only update file URLs if new files are uploaded
    if (req.files?.coverImage) {
      bookData.cover_image_url = `/uploads/covers/${req.files.coverImage[0].filename}`;
    }
    if (req.files?.pdfFile) {
      bookData.pdf_url = `/uploads/pdfs/${req.files.pdfFile[0].filename}`;
    }

    const updatedBook = await Book.update(id, bookData);

    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook
    });
  } catch (error) {
    console.error("Book update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update book"
    });
  }
});

app.delete("/api/v1/admin/books/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBook = await Book.delete(id);
    
    if (!deletedBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.json({
      success: true,
      message: `Book ${id} deleted successfully`,
      data: deletedBook
    });
  } catch (error) {
    console.error("Book deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete book"
    });
  }
});

// Courses - Protected routes
app.get("/api/v1/admin/courses", authenticateToken, requireAdmin, (req, res) => {
  res.json({ 
    success: true, 
    data: [
      {
        id: 1,
        title: "Advanced Mathematics",
        description: "Comprehensive course covering advanced mathematical concepts",
        category: "Mathematics",
        level: "Advanced",
        price: 99.99,
        originalPrice: 149.99,
        students: 25,
        status: "active",
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  });
});

app.post("/api/v1/admin/courses", authenticateToken, requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, description, category, level, price, originalPrice, students, status } = req.body;
    
    if (!title || !price) {
      return res.status(400).json({
        success: false,
        message: "Title and price are required"
      });
    }

    const courseData = {
      id: Date.now(),
      title,
      description: description || "",
      category: category || "Mathematics",
      level: level || "Foundation",
      price: parseFloat(price) || 0,
      originalPrice: parseFloat(originalPrice) || parseFloat(price) || 0,
      students: parseInt(students) || 0,
      status: status || "draft",
      is_published: false,
      image_url: req.files?.image ? `/uploads/covers/${req.files.image[0].filename}` : null,
      pdf_url: req.files?.pdf ? `/uploads/pdfs/${req.files.pdf[0].filename}` : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: "Course created successfully",
      data: courseData
    });
  } catch (error) {
    console.error("Course creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create course"
    });
  }
});

app.put("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, level, price, originalPrice, students, status } = req.body;
    
    const courseData = {
      id: parseInt(id),
      title: title || "Updated Course",
      description: description || "",
      category: category || "Mathematics",
      level: level || "Foundation",
      price: parseFloat(price) || 0,
      originalPrice: parseFloat(originalPrice) || parseFloat(price) || 0,
      students: parseInt(students) || 0,
      status: status || "draft",
      is_published: false,
      image_url: req.files?.image ? `/uploads/covers/${req.files.image[0].filename}` : null,
      pdf_url: req.files?.pdf ? `/uploads/pdfs/${req.files.pdf[0].filename}` : null,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: "Course updated successfully",
      data: courseData
    });
  } catch (error) {
    console.error("Course update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update course"
    });
  }
});

app.delete("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      message: `Course ${id} deleted successfully`
    });
  } catch (error) {
    console.error("Course deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete course"
    });
  }
});

// Live Classes - Protected routes with meeting_link support
app.get("/api/v1/admin/live-classes", authenticateToken, requireAdmin, (req, res) => {
  res.json({ 
    success: true, 
    data: [
      {
        id: 1,
        title: "Advanced Calculus Live Session",
        description: "Interactive live session covering advanced calculus topics",
        category: "Mathematics",
        level: "Advanced",
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        max_students: 50,
        meeting_link: "https://meet.google.com/abc-defg-hij",
        status: "scheduled",
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  });
});

app.post("/api/v1/admin/live-classes", authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { title, description, category, level, duration, maxStudents, scheduledAt, meetingLink, status } = req.body;
    
    if (!title || !meetingLink || !duration || !maxStudents) {
      return res.status(400).json({
        success: false,
        message: "Title, meeting link, duration, and max students are required"
      });
    }

    // Validate scheduledAt is in the future
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be in the future"
      });
    }

    const liveClassData = {
      id: Date.now(),
      title,
      description: description || "",
      category: category || "Mathematics",
      level: level || "Foundation",
      scheduled_at: scheduledAt,
      duration: parseInt(duration) || 60,
      max_students: parseInt(maxStudents) || 50,
      meeting_link: meetingLink,
      status: status || "draft",
      is_published: false,
      image_url: req.file ? `/uploads/covers/${req.file.filename}` : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: "Live class created successfully",
      data: liveClassData
    });
  } catch (error) {
    console.error("Live class creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create live class"
    });
  }
});

app.put("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, level, duration, maxStudents, scheduledAt, meetingLink, status } = req.body;
    
    const liveClassData = {
      id: parseInt(id),
      title: title || "Updated Live Class",
      description: description || "",
      category: category || "Mathematics",
      level: level || "Foundation",
      scheduled_at: scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: parseInt(duration) || 60,
      max_students: parseInt(maxStudents) || 50,
      meeting_link: meetingLink || "https://meet.google.com/abc-defg-hij",
      status: status || "draft",
      is_published: false,
      image_url: req.file ? `/uploads/covers/${req.file.filename}` : null,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: "Live class updated successfully",
      data: liveClassData
    });
  } catch (error) {
    console.error("Live class update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update live class"
    });
  }
});

app.delete("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      message: `Live class ${id} deleted successfully`
    });
  } catch (error) {
    console.error("Live class deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete live class"
    });
  }
});

// Users - Protected routes with full CRUD
app.get("/api/v1/admin/users", authenticateToken, requireAdmin, (req, res) => {
  res.json({ 
    success: true, 
    data: [
      {
        id: 1,
        name: "Admin User",
        email: "dc2006089@gmail.com",
        role: "admin",
        is_active: true,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        is_active: true,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  });
});

app.post("/api/v1/admin/users", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, email, role, is_active } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required"
      });
    }

    const userData = {
      id: Date.now(),
      name,
      email,
      role: role || "user",
      is_active: is_active !== false,
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: "User created successfully",
      data: userData
    });
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user"
    });
  }
});

app.put("/api/v1/admin/users/:id", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;
    
    const userData = {
      id: parseInt(id),
      name: name || "Updated User",
      email: email || "user@example.com",
      role: role || "user",
      is_active: is_active !== false,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: "User updated successfully",
      data: userData
    });
  } catch (error) {
    console.error("User update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user"
    });
  }
});

app.delete("/api/v1/admin/users/:id", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      message: `User ${id} deleted successfully`
    });
  } catch (error) {
    console.error("User deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user"
    });
  }
});

app.put("/api/v1/admin/users/:id/status", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    res.json({
      success: true,
      message: `User ${id} status updated to ${is_active ? 'active' : 'inactive'}`,
      data: {
        id: parseInt(id),
        is_active: is_active,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("User status update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status"
    });
  }
});

// File upload endpoint for admin
app.post("/api/v1/admin/upload", authenticateToken, requireAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const fileUrl = `/uploads/${req.file.destination.split('/').pop()}/${req.file.filename}`;
    
    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload file"
    });
  }
});

// ----------------- 404 + Error Handler -----------------
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error("🔥 Global error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

module.exports = app;
