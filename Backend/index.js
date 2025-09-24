// Vercel serverless function entry point - SIMPLIFIED VERSION
const express = require('express');
const cors = require('cors');

const app = express();

// CORS
app.use(cors({
  origin: "*",
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// JWT Utils
const { generateAccessToken, generateRefreshToken } = require('./utils/jwt');

// Root
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API is running ✅",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    serverless: true,
  });
});

// Health
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API is healthy ✅",
    timestamp: new Date().toISOString(),
  });
});

// AUTH ROUTES
app.post("/api/v1/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    if (email === 'dc2006089@gmail.com' && password === 'Myname*321') {
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
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      timestamp: new Date().toISOString()
    });
  }
});

// MOBILE ROUTES
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
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        title: "Basic Algebra",
        description: "Introduction to algebraic concepts and problem solving",
        category: "Mathematics",
        level: "Foundation",
        price: 49.99,
        status: "active",
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
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
        description: "Comprehensive textbook covering advanced calculus topics",
        category: "Mathematics",
        level: "Advanced",
        pages: 450,
        isbn: "978-1234567890",
        cover_image_url: "/placeholder.svg",
        pdf_url: "/uploads/advanced-calculus.pdf",
        status: "active",
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        title: "Linear Algebra Fundamentals",
        author: "Prof. Jane Doe",
        description: "Essential guide to linear algebra concepts and applications",
        category: "Mathematics",
        level: "Intermediate",
        pages: 320,
        isbn: "978-0987654321",
        cover_image_url: "/placeholder.svg",
        pdf_url: "/uploads/linear-algebra.pdf",
        status: "active",
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/mobile/live-classes", (req, res) => {
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
        status: "scheduled",
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

// ADMIN ROUTES
app.get("/api/v1/admin/dashboard", (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      totalCourses: 25,
      totalBooks: 40,
      totalLiveClasses: 12,
      totalRevenue: 125000,
      recentActivity: [
        {
          id: 1,
          type: "user_registration",
          message: "New user registered",
          timestamp: new Date().toISOString()
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/admin/books", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: "Advanced Calculus Textbook",
        author: "Dr. John Smith",
        description: "Comprehensive textbook covering advanced calculus topics",
        category: "Mathematics",
        status: "active",
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/admin/courses", (req, res) => {
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
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/admin/live-classes", (req, res) => {
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
        status: "scheduled",
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/admin/users", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "Admin User",
        email: "dc2006089@gmail.com",
        role: "admin",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

// POST routes for creating content
app.post("/api/v1/admin/books", (req, res) => {
  res.json({
    success: true,
    message: "Book created successfully (serverless mode)",
    data: {
      id: Date.now(),
      title: req.body.title || "New Book",
      author: req.body.author || "Unknown Author",
      description: req.body.description || "Book description",
      category: req.body.category || "Mathematics",
      status: "draft",
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

app.post("/api/v1/admin/courses", (req, res) => {
  res.json({
    success: true,
    message: "Course created successfully (serverless mode)",
    data: {
      id: Date.now(),
      title: req.body.title || "New Course",
      description: req.body.description || "Course description",
      category: req.body.category || "Mathematics",
      level: req.body.level || "Foundation",
      price: req.body.price || 0,
      status: "draft",
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

app.post("/api/v1/admin/live-classes", (req, res) => {
  res.json({
    success: true,
    message: "Live class created successfully (serverless mode)",
    data: {
      id: Date.now(),
      title: req.body.title || "New Live Class",
      description: req.body.description || "Live class description",
      category: req.body.category || "Mathematics",
      level: req.body.level || "Foundation",
      scheduled_at: req.body.scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: req.body.duration || 60,
      max_students: req.body.maxStudents || 50,
      status: "draft",
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Global error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;
