// Vercel serverless function for Mathematico Backend
// This is a simplified version that includes all necessary functionality

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
  'https://mathematico-backend-new.vercel.app',
  // Mobile app origins (React Native/Expo)
  'exp://192.168.1.100:8081',
  'exp://192.168.1.101:8081',
  'exp://192.168.1.102:8081',
  'exp://192.168.1.103:8081',
  'exp://192.168.1.104:8081',
  'exp://192.168.1.105:8081',
  'exp://192.168.1.106:8081',
  'exp://192.168.1.107:8081',
  'exp://192.168.1.108:8081',
  'exp://192.168.1.109:8081',
  'exp://192.168.1.110:8081',
  'exp://10.0.2.2:8081',
  'exp://localhost:8081',
  'exp://127.0.0.1:8081'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ CORS allowing request with no origin (mobile app)');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowing origin:', origin);
      return callback(null, true);
    }
    
    // Allow Vercel preview URLs
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      console.log('✅ CORS allowing Vercel preview URL:', origin);
      return callback(null, true);
    }
    
    // Allow Expo/React Native development URLs
    if (origin.match(/^exp:\/\/.*$/)) {
      console.log('✅ CORS allowing Expo development URL:', origin);
      return callback(null, true);
    }
    
    // Allow localhost with any port for development
    if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      console.log('✅ CORS allowing localhost URL:', origin);
      return callback(null, true);
    }
    
    // Allow local IP addresses for mobile development
    if (origin.match(/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/)) {
      console.log('✅ CORS allowing local IP URL:', origin);
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
    'Pragma',
    'X-API-Key',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200
}));

// Static file serving for public directory
app.use(express.static('public'));

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
    message: 'Mathematico API Server',
    version: '1.1.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
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

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    version: '1.3.0',
    mobile: {
      supported: true,
      baseUrl: 'https://mathematico-backend-new.vercel.app/api/v1',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        courses: '/api/v1/courses',
        books: '/api/v1/books',
        liveClasses: '/api/v1/live-classes',
        admin: '/api/v1/admin'
      },
      note: 'Use https://mathematico-backend-new.vercel.app as your API base URL for mobile apps'
    }
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

// Registration endpoint
app.post('/api/v1/auth/register', (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { email, password, name } = req.body;
    
    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email, password, and name are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if email is already taken (admin email)
    if (email === 'dc2006089@gmail.com') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Email already exists',
        timestamp: new Date().toISOString()
      });
    }
    
    // Generate a simple token
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
    console.error('Registration endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Registration failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Auth status endpoint
app.get('/api/v1/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }
    
    // Simple token validation
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [email, timestamp] = decoded.split(':');
      
      if (!email) {
        throw new Error('Invalid token format');
      }
      
      // Check if it's the admin user
      if (email === 'dc2006089@gmail.com') {
        res.json({
          success: true,
          data: {
            user: {
              id: 1,
              email: email,
              name: 'Admin User',
              isAdmin: true,
              role: 'admin'
            }
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({
          success: true,
          data: {
            user: {
              id: Math.floor(Math.random() * 1000) + 2,
              email: email,
              name: email.split('@')[0] || 'User',
              isAdmin: false,
              role: 'user'
            }
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Auth status endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Auth status check failed',
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
    
    // Simple token refresh (in production, use proper JWT)
    const newToken = Buffer.from(`refreshed:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
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

// Forgot password endpoint
app.post('/api/v1/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email is required',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Password reset email sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Forgot password endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to send reset email',
      timestamp: new Date().toISOString()
    });
  }
});

// Reset password endpoint
app.post('/api/v1/auth/reset-password', (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Token and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset password endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Password reset failed',
      timestamp: new Date().toISOString()
    });
  }
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

app.get('/api/v1/courses/:id', (req, res) => {
  const courseId = req.params.id;
  
  // Sample course detail
  const course = {
    id: parseInt(courseId),
    title: 'Advanced Mathematics',
    description: 'Comprehensive course covering advanced mathematical concepts including differential equations, linear algebra, and complex analysis.',
    instructor: 'Dr. John Smith',
    price: 99.99,
    duration: '12 weeks',
    level: 'Advanced',
    category: 'Mathematics',
    thumbnail: '/placeholder.svg',
    rating: 4.8,
    studentsCount: 150,
    status: 'published',
    modules: [
      {
        id: 1,
        title: 'Introduction to Advanced Mathematics',
        lessons: [
          { id: 1, title: 'Overview of Course', duration: '15 min', type: 'video' },
          { id: 2, title: 'Mathematical Foundations', duration: '30 min', type: 'video' }
        ]
      },
      {
        id: 2,
        title: 'Differential Equations',
        lessons: [
          { id: 3, title: 'First Order Equations', duration: '45 min', type: 'video' },
          { id: 4, title: 'Second Order Equations', duration: '50 min', type: 'video' }
        ]
      }
    ],
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: course,
    message: 'Course details retrieved successfully',
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

app.get('/api/v1/books/:id', (req, res) => {
  const bookId = req.params.id;
  
  const book = {
    id: parseInt(bookId),
    title: 'Advanced Calculus Textbook',
    author: 'Dr. John Smith',
    description: 'Comprehensive textbook covering advanced calculus topics including limits, derivatives, integrals, and series.',
    price: 49.99,
    category: 'Mathematics',
    pages: 450,
    isbn: '978-1234567890',
    coverImage: '/placeholder.svg',
    pdfUrl: '/uploads/advanced-calculus.pdf',
    status: 'published',
    chapters: [
      { id: 1, title: 'Introduction to Calculus', pageStart: 1, pageEnd: 50 },
      { id: 2, title: 'Limits and Continuity', pageStart: 51, pageEnd: 100 },
      { id: 3, title: 'Derivatives', pageStart: 101, pageEnd: 200 }
    ],
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: book,
    message: 'Book details retrieved successfully',
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

app.get('/api/v1/live-classes/:id', (req, res) => {
  const classId = req.params.id;
  
  const liveClass = {
    id: parseInt(classId),
    title: 'Advanced Mathematics Live Session',
    description: 'Interactive live session on advanced mathematical concepts including differential equations and linear algebra.',
    instructor: 'Dr. John Smith',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    maxStudents: 50,
    currentStudents: 25,
    price: 29.99,
    status: 'upcoming',
    meetingLink: 'https://meet.example.com/advanced-math',
    thumbnail: '/placeholder.svg',
    agenda: [
      { time: '0-30 min', topic: 'Introduction and Overview' },
      { time: '30-60 min', topic: 'Differential Equations' },
      { time: '60-90 min', topic: 'Linear Algebra' },
      { time: '90-120 min', topic: 'Q&A Session' }
    ],
    materials: [
      { name: 'Course Notes', url: '/uploads/advanced-math-notes.pdf' },
      { name: 'Practice Problems', url: '/uploads/practice-problems.pdf' }
    ],
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: liveClass,
    message: 'Live class details retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Purchase and Enrollment endpoints
app.post('/api/v1/courses/:id/purchase', (req, res) => {
  const courseId = req.params.id;
  const { paymentMethod, amount } = req.body;
  
  // Simulate payment processing
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.json({
    success: true,
    data: {
      paymentId: paymentId,
      courseId: parseInt(courseId),
      amount: amount || 99.99,
      status: 'completed',
      enrolledAt: new Date().toISOString(),
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    },
    message: 'Course purchased and enrolled successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/enrollments/status', (req, res) => {
  res.json({
    success: true,
    data: {
      enrolled: true,
      status: 'enrolled',
      courses: [
        {
          id: 1,
          title: 'Advanced Mathematics',
          enrolledAt: new Date().toISOString(),
          progress: 25,
          accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    message: 'Enrollment status retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/enrollments/my-courses', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        courseId: 1,
        title: 'Advanced Mathematics',
        instructor: 'Dr. John Smith',
        thumbnail: '/placeholder.svg',
        progress: 25,
        enrolledAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    message: 'User courses retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/enrollments/my-books', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        bookId: 1,
        title: 'Advanced Calculus Textbook',
        author: 'Dr. John Smith',
        coverImage: '/placeholder.svg',
        purchasedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    message: 'User books retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/enrollments/my-live-classes', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        liveClassId: 1,
        title: 'Advanced Mathematics Live Session',
        instructor: 'Dr. John Smith',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        enrolledAt: new Date().toISOString(),
        meetingLink: 'https://meet.example.com/advanced-math'
      }
    ],
    message: 'User live classes retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Course access verification
app.get('/api/v1/courses/:id/access', (req, res) => {
  const courseId = req.params.id;
  
  res.json({
    success: true,
    data: {
      hasAccess: true,
      courseId: parseInt(courseId),
      enrolledAt: new Date().toISOString(),
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 25
    },
    message: 'Course access verified',
    timestamp: new Date().toISOString()
  });
});

// Book access verification
app.get('/api/v1/books/:id/access', (req, res) => {
  const bookId = req.params.id;
  
  res.json({
    success: true,
    data: {
      hasAccess: true,
      bookId: parseInt(bookId),
      purchasedAt: new Date().toISOString(),
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    message: 'Book access verified',
    timestamp: new Date().toISOString()
  });
});

// Live class access verification
app.get('/api/v1/live-classes/:id/access', (req, res) => {
  const classId = req.params.id;
  
  res.json({
    success: true,
    data: {
      hasAccess: true,
      liveClassId: parseInt(classId),
      enrolledAt: new Date().toISOString(),
      meetingLink: 'https://meet.example.com/advanced-math'
    },
    message: 'Live class access verified',
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

app.get('/api/v1/admin/users', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Admin User',
        email: 'dc2006089@gmail.com',
        role: 'admin',
        isAdmin: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    },
    message: 'Admin users retrieved successfully',
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

app.get('/api/v1/admin/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      siteName: 'Mathematico',
      siteDescription: 'A Mathematics Learning Platform',
      contactEmail: 'dc2006089@gmail.com',
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true,
      maxFileSize: '10MB',
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        accentColor: '#f59e0b'
      }
    },
    message: 'Admin settings retrieved successfully',
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

// Admin PUT endpoints for updating resources
app.put('/api/v1/admin/courses/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'Course updated successfully',
    timestamp: new Date().toISOString()
  });
});

app.put('/api/v1/admin/books/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'Book updated successfully',
    timestamp: new Date().toISOString()
  });
});

app.put('/api/v1/admin/live-classes/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'Live class updated successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin DELETE endpoints
app.delete('/api/v1/admin/courses/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Course deleted successfully',
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/v1/admin/books/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Book deleted successfully',
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/v1/admin/live-classes/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Live class deleted successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin settings update
app.put('/api/v1/admin/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'Settings updated successfully',
    timestamp: new Date().toISOString()
  });
});

// Static asset handling with CORS
app.get('/logo.png', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.match(/^https:\/\/.*\.vercel\.app$/))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile('logo.png', { root: 'public' }, (err) => {
    if (err) {
      console.error('Error serving logo.png:', err);
      res.status(404).json({ error: 'Logo not found' });
    }
  });
});

app.get('/placeholder.svg', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.match(/^https:\/\/.*\.vercel\.app$/))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile('placeholder.svg', { root: 'public' }, (err) => {
    if (err) {
      console.error('Error serving placeholder.svg:', err);
      res.status(404).json({ error: 'Placeholder not found' });
    }
  });
});

// Favicon handling
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/favicon.png', (req, res) => {
  res.status(204).end();
});

app.get('/favicon', (req, res) => {
  res.status(204).end();
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