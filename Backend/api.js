// Vercel serverless function for Mathematico Backend
// This is the main entry point for Vercel deployment
// Updated: 2025-09-15 - Fixed deployment conflicts - FORCE NEW DEPLOYMENT

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://mathematico-frontend.vercel.app',
  'https://mathematico-frontend-gvpmf2rwj-anupam-das-projects-db63fa41.vercel.app',
  'https://mathematico-backend-new.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview URLs
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      console.log('✅ CORS allowing Vercel preview URL:', origin);
      return callback(null, true);
    }
    
    console.log('🚫 CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Cache-Control', 
    'Accept', 
    'Origin',
    'Pragma'
  ],
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mathematico API Server - ROUTING FIXED v1.5.0',
    version: '1.5.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    deployment: 'api.js - ROUTING FIXED',
    fix: 'api-v1-endpoint-routing-resolved',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      books: '/api/v1/books',
      courses: '/api/v1/courses',
      liveClasses: '/api/v1/live-classes',
      admin: '/api/v1/admin',
      enrollments: '/api/v1/enrollments'
    }
  });
});

// API v1 base endpoint - FIXED ROUTING
app.get('/api/v1', (req, res) => {
  res.json({
    status: 'Mathematico API v1 running',
    message: 'Mathematico API v1 - ROUTING FIXED',
    version: '1.5.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    deployment: 'api.js - ROUTING FIXED',
    fix: 'api-v1-endpoint-routing-resolved',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      books: '/api/v1/books',
      courses: '/api/v1/courses',
      liveClasses: '/api/v1/live-classes',
      admin: '/api/v1/admin',
      enrollments: '/api/v1/enrollments',
      users: '/api/v1/users',
      payments: '/api/v1/payments'
    }
  });
});

// Alternative route handler for /api/v1/ (with trailing slash)
app.get('/api/v1/', (req, res) => {
  res.json({
    status: 'Mathematico API v1 running',
    message: 'Mathematico API v1 - ROUTING FIXED (trailing slash)',
    version: '1.5.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    deployment: 'api.js - ROUTING FIXED',
    fix: 'api-v1-endpoint-routing-resolved',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      books: '/api/v1/books',
      courses: '/api/v1/courses',
      liveClasses: '/api/v1/live-classes',
      admin: '/api/v1/admin',
      enrollments: '/api/v1/enrollments',
      users: '/api/v1/users',
      payments: '/api/v1/payments'
    }
  });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    version: '1.4.0'
  });
});

// Auth endpoints
app.post('/api/v1/auth/login', (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
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
    
    // Check if it's the admin user
    if (email === 'dc2006089@gmail.com' && password === 'Myname*321') {
      // Generate a simple token (in production, use proper JWT)
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 1,
            email: email,
            name: 'Admin User',
            isAdmin: true,
            role: 'admin'
          },
          tokens: {
            accessToken: token,
            refreshToken: token,
            expiresIn: 3600
          }
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // For other users, create a simple user
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: Math.floor(Math.random() * 1000) + 2,
            email: email,
            name: email.split('@')[0] || 'User',
            isAdmin: false,
            role: 'user'
          },
          tokens: {
            accessToken: token,
            refreshToken: token,
            expiresIn: 3600
          }
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Login failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Register endpoint
app.post('/api/v1/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name, email and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: Math.floor(Math.random() * 1000) + 2,
          email: email,
          name: name,
          isAdmin: false,
          role: 'user'
        },
        tokens: {
          accessToken: token,
          refreshToken: token,
          expiresIn: 3600
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Register endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Registration failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Refresh token endpoint
app.post('/api/v1/auth/refresh-token', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Refresh token is required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Generate new tokens
    const newToken = Buffer.from(`user:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: newToken,
          refreshToken: newToken,
          expiresIn: 3600
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Refresh token endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Token refresh failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Logout endpoint
app.post('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
});

// Get current user profile
app.get('/api/v1/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'No valid token provided',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    data: {
      id: 1,
      email: 'dc2006089@gmail.com',
      name: 'Admin User',
      isAdmin: true,
      role: 'admin'
    },
    timestamp: new Date().toISOString()
  });
});

// User-facing API endpoints
app.get('/api/v1/courses', (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  
  // Sample courses data
  const sampleCourses = [
    {
      id: 1,
      title: 'Advanced Mathematics',
      description: 'Comprehensive course covering advanced mathematical concepts',
      instructor: 'Dr. John Smith',
      price: 99.99,
      duration: '12 weeks',
      level: 'Advanced',
      category: 'Mathematics',
      thumbnail: '/placeholder.svg',
      rating: 4.8,
      studentsCount: 150,
      status: 'published',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Calculus Fundamentals',
      description: 'Learn the basics of calculus from scratch',
      instructor: 'Prof. Jane Doe',
      price: 79.99,
      duration: '8 weeks',
      level: 'Beginner',
      category: 'Mathematics',
      thumbnail: '/placeholder.svg',
      rating: 4.6,
      studentsCount: 200,
      status: 'published',
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: sampleCourses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: sampleCourses.length,
      totalPages: Math.ceil(sampleCourses.length / parseInt(limit))
    },
    message: 'Courses retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Get single course
app.get('/api/v1/courses/:id', (req, res) => {
  const { id } = req.params;
  
  const course = {
    id: parseInt(id),
    title: 'Advanced Mathematics',
    description: 'Comprehensive course covering advanced mathematical concepts',
    instructor: 'Dr. John Smith',
    price: 99.99,
    duration: '12 weeks',
    level: 'Advanced',
    category: 'Mathematics',
    thumbnail: '/placeholder.svg',
    rating: 4.8,
    studentsCount: 150,
    status: 'published',
    createdAt: new Date().toISOString(),
    modules: [
      {
        id: 1,
        title: 'Introduction to Advanced Mathematics',
        lessons: [
          { id: 1, title: 'Overview', duration: '15 min' },
          { id: 2, title: 'Prerequisites', duration: '20 min' }
        ]
      }
    ]
  };
  
  res.json({
    success: true,
    data: course,
    message: 'Course retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Enroll in course
app.post('/api/v1/courses/:id/enroll', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      enrollmentId: Math.floor(Math.random() * 1000) + 1,
      courseId: parseInt(id),
      enrolledAt: new Date().toISOString(),
      status: 'enrolled'
    },
    message: 'Successfully enrolled in course',
    timestamp: new Date().toISOString()
  });
});

// Get user's enrolled courses
app.get('/api/v1/courses/my-courses', (req, res) => {
  const enrolledCourses = [
    {
      id: 1,
      title: 'Advanced Mathematics',
      enrolledAt: new Date().toISOString(),
      progress: 25,
      status: 'enrolled'
    }
  ];
  
  res.json({
    success: true,
    data: enrolledCourses,
    message: 'Enrolled courses retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/books', (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  
  // Sample books data
  const sampleBooks = [
    {
      id: 1,
      title: 'Advanced Calculus Textbook',
      author: 'Dr. John Smith',
      description: 'Comprehensive textbook covering advanced calculus topics',
      price: 49.99,
      category: 'Mathematics',
      pages: 450,
      isbn: '978-1234567890',
      coverImage: '/placeholder.svg',
      pdfUrl: '/uploads/advanced-calculus.pdf',
      status: 'published',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Linear Algebra Fundamentals',
      author: 'Prof. Jane Doe',
      description: 'Essential guide to linear algebra concepts and applications',
      price: 39.99,
      category: 'Mathematics',
      pages: 320,
      isbn: '978-0987654321',
      coverImage: '/placeholder.svg',
      pdfUrl: '/uploads/linear-algebra.pdf',
      status: 'published',
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: sampleBooks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: sampleBooks.length,
      totalPages: Math.ceil(sampleBooks.length / parseInt(limit))
    },
    message: 'Books retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Get single book
app.get('/api/v1/books/:id', (req, res) => {
  const { id } = req.params;
  
  const book = {
    id: parseInt(id),
    title: 'Advanced Calculus Textbook',
    author: 'Dr. John Smith',
    description: 'Comprehensive textbook covering advanced calculus topics',
    price: 49.99,
    category: 'Mathematics',
    pages: 450,
    isbn: '978-1234567890',
    coverImage: '/placeholder.svg',
    pdfUrl: '/uploads/advanced-calculus.pdf',
    status: 'published',
    createdAt: new Date().toISOString(),
    chapters: [
      { id: 1, title: 'Introduction to Calculus', pageStart: 1, pageEnd: 50 },
      { id: 2, title: 'Limits and Continuity', pageStart: 51, pageEnd: 100 }
    ]
  };
  
  res.json({
    success: true,
    data: book,
    message: 'Book retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Purchase book
app.post('/api/v1/books/:id/purchase', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      purchaseId: Math.floor(Math.random() * 1000) + 1,
      bookId: parseInt(id),
      purchasedAt: new Date().toISOString(),
      status: 'purchased'
    },
    message: 'Book purchased successfully',
    timestamp: new Date().toISOString()
  });
});

// Get user's purchased books
app.get('/api/v1/books/my-books', (req, res) => {
  const purchasedBooks = [
    {
      id: 1,
      title: 'Advanced Calculus Textbook',
      purchasedAt: new Date().toISOString(),
      status: 'purchased'
    }
  ];
  
  res.json({
    success: true,
    data: purchasedBooks,
    message: 'Purchased books retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/live-classes', (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  // Sample live classes data
  const sampleLiveClasses = [
    {
      id: 1,
      title: 'Advanced Mathematics Live Session',
      description: 'Interactive live session on advanced mathematical concepts',
      instructor: 'Dr. John Smith',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      duration: 120, // minutes
      maxStudents: 50,
      currentStudents: 25,
      price: 29.99,
      status: 'upcoming',
      meetingLink: 'https://meet.example.com/advanced-math',
      thumbnail: '/placeholder.svg',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Calculus Problem Solving',
      description: 'Live problem-solving session for calculus students',
      instructor: 'Prof. Jane Doe',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      duration: 90,
      maxStudents: 30,
      currentStudents: 18,
      price: 19.99,
      status: 'upcoming',
      meetingLink: 'https://meet.example.com/calculus-problems',
      thumbnail: '/placeholder.svg',
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: sampleLiveClasses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: sampleLiveClasses.length,
      totalPages: Math.ceil(sampleLiveClasses.length / parseInt(limit))
    },
    message: 'Live classes retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Get single live class
app.get('/api/v1/live-classes/:id', (req, res) => {
  const { id } = req.params;
  
  const liveClass = {
    id: parseInt(id),
    title: 'Advanced Mathematics Live Session',
    description: 'Interactive live session on advanced mathematical concepts',
    instructor: 'Dr. John Smith',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    maxStudents: 50,
    currentStudents: 25,
    price: 29.99,
    status: 'upcoming',
    meetingLink: 'https://meet.example.com/advanced-math',
    thumbnail: '/placeholder.svg',
    createdAt: new Date().toISOString(),
    agenda: [
      'Introduction to Advanced Mathematics',
      'Problem Solving Techniques',
      'Q&A Session'
    ]
  };
  
  res.json({
    success: true,
    data: liveClass,
    message: 'Live class retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Join live class
app.post('/api/v1/live-classes/:id/join', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      enrollmentId: Math.floor(Math.random() * 1000) + 1,
      liveClassId: parseInt(id),
      joinedAt: new Date().toISOString(),
      status: 'enrolled'
    },
    message: 'Successfully joined live class',
    timestamp: new Date().toISOString()
  });
});

// Get user's enrolled live classes
app.get('/api/v1/live-classes/my-classes', (req, res) => {
  const enrolledClasses = [
    {
      id: 1,
      title: 'Advanced Mathematics Live Session',
      joinedAt: new Date().toISOString(),
      status: 'enrolled'
    }
  ];
  
  res.json({
    success: true,
    data: enrolledClasses,
    message: 'Enrolled live classes retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Users endpoints
app.get('/api/v1/users', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const users = [
    {
      id: 1,
      name: 'Admin User',
      email: 'dc2006089@gmail.com',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: users.length,
      totalPages: Math.ceil(users.length / parseInt(limit))
    },
    message: 'Users retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Payments endpoints
app.post('/api/v1/payments/initiate', (req, res) => {
  const { amount, currency = 'USD', itemType, itemId } = req.body;
  
  res.json({
    success: true,
    data: {
      paymentId: Math.floor(Math.random() * 1000) + 1,
      amount: amount,
      currency: currency,
      status: 'pending',
      paymentUrl: `https://payment.example.com/pay/${Math.floor(Math.random() * 1000) + 1}`,
      itemType: itemType,
      itemId: itemId
    },
    message: 'Payment initiated successfully',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/payments/verify', (req, res) => {
  const { paymentId, transactionId } = req.body;
  
  res.json({
    success: true,
    data: {
      paymentId: paymentId,
      transactionId: transactionId,
      status: 'completed',
      verifiedAt: new Date().toISOString()
    },
    message: 'Payment verified successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/payments/history', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const payments = [
    {
      id: 1,
      amount: 99.99,
      currency: 'USD',
      status: 'completed',
      itemType: 'course',
      itemId: 1,
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: payments.length,
      totalPages: Math.ceil(payments.length / parseInt(limit))
    },
    message: 'Payment history retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Create payment order endpoint
app.post('/api/v1/payments/create-order', (req, res) => {
  const { courseId } = req.body;
  
  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: 'Course ID is required',
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock payment order creation
  const order = {
    id: 'order_' + Date.now(),
    amount: 99.99,
    currency: 'USD',
    receipt: 'receipt_' + Date.now(),
    status: 'created',
    courseId: courseId,
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: {
      order: order,
      course: {
        id: courseId,
        title: 'Advanced Mathematics',
        price: 99.99
      }
    },
    message: 'Payment order created successfully',
    timestamp: new Date().toISOString()
  });
});

// Verify payment endpoint
app.post('/api/v1/payments/verify', (req, res) => {
  const { paymentId, orderId, signature, courseId } = req.body;
  
  if (!paymentId || !orderId || !signature || !courseId) {
    return res.status(400).json({
      success: false,
      message: 'All payment verification fields are required',
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock payment verification
  res.json({
    success: true,
    data: {
      enrollment: {
        id: 'enrollment_' + Date.now(),
        courseId: courseId,
        courseTitle: 'Advanced Mathematics',
        enrolledAt: new Date().toISOString(),
        paymentStatus: 'completed'
      },
      payment: {
        id: paymentId,
        amount: 99.99,
        currency: 'USD',
        status: 'completed'
      }
    },
    message: 'Payment verified successfully',
    timestamp: new Date().toISOString()
  });
});

// Enrollments endpoints
app.get('/api/v1/enrollments', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const enrollments = [
    {
      id: 1,
      userId: 1,
      courseId: 1,
      status: 'enrolled',
      enrolledAt: new Date().toISOString(),
      progress: 25
    }
  ];
  
  res.json({
    success: true,
    data: enrollments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: enrollments.length,
      totalPages: Math.ceil(enrollments.length / parseInt(limit))
    },
    message: 'Enrollments retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Enrollment status endpoint
app.get('/api/v1/enrollments/status', (req, res) => {
  res.json({
    success: true,
    data: {
      hasEnrollment: true,
      isAdmin: false,
      enrollments: [
        {
          id: 1,
          enrolledAt: new Date().toISOString(),
          course: {
            id: 1,
            title: 'Advanced Mathematics',
            price: 99.99
          }
        }
      ]
    },
    message: 'Enrollment status retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin endpoints
app.get('/api/v1/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 1,
      totalCourses: 0,
      totalBooks: 0,
      totalLiveClasses: 0,
      totalEnrollments: 0,
      recentActivity: [],
      stats: {
        users: { total: 1, active: 1, inactive: 0 },
        courses: { total: 0, published: 0, draft: 0 },
        books: { total: 0, published: 0, draft: 0 },
        liveClasses: { total: 0, upcoming: 0, completed: 0 }
      }
    },
    message: 'Dashboard stats retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/admin/courses', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  res.json({
    success: true,
    data: [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0,
      totalPages: 0
    },
    message: 'Admin courses retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/admin/books', (req, res) => {
  const { page = 1, limit = 100, status = 'all', category = 'all' } = req.query;
  res.json({
    success: true,
    data: [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0,
      totalPages: 0
    },
    message: 'Admin books retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/admin/live-classes', (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  res.json({
    success: true,
    data: [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0,
      totalPages: 0
    },
    message: 'Admin live classes retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin POST endpoints for creating resources
app.post('/api/v1/admin/courses', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Math.floor(Math.random() * 1000) + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    message: 'Course created successfully',
    timestamp: new Date().toISOString()
  });
});

app.put('/api/v1/admin/courses/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: {
      id: parseInt(id),
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'Course updated successfully',
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/v1/admin/courses/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: 'Course deleted successfully',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/admin/books', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Math.floor(Math.random() * 1000) + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    message: 'Book created successfully',
    timestamp: new Date().toISOString()
  });
});

app.put('/api/v1/admin/books/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: {
      id: parseInt(id),
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'Book updated successfully',
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/v1/admin/books/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: 'Book deleted successfully',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/admin/live-classes', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Math.floor(Math.random() * 1000) + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    message: 'Live class created successfully',
    timestamp: new Date().toISOString()
  });
});

app.put('/api/v1/admin/live-classes/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: {
      id: parseInt(id),
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'Live class updated successfully',
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/v1/admin/live-classes/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: 'Live class deleted successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin user management
app.get('/api/v1/admin/users', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const users = [
    {
      id: 1,
      name: 'Admin User',
      email: 'dc2006089@gmail.com',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: users.length,
      totalPages: Math.ceil(users.length / parseInt(limit))
    },
    message: 'Admin users retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.put('/api/v1/admin/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: {
      id: parseInt(id),
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'User updated successfully',
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/v1/admin/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: 'User deleted successfully',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// Export the app for Vercel
module.exports = app;