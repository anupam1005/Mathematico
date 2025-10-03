// Vercel serverless function for mobile endpoints
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// JWT secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Simple authentication middleware for serverless
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
};

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19006',
      'http://localhost:8081',
      'https://mathematico-frontend.vercel.app',
      'https://mathematico-backend-new.vercel.app'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ]
}));

app.use(express.json());

// Root mobile endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is working ✅',
    endpoints: {
      books: '/books',
      courses: '/courses',
      liveClasses: '/live-classes',
      search: '/search',
      featured: '/featured',
      categories: '/categories',
      test: '/test',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is healthy',
    database: 'MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

// Books endpoints
app.get('/books', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        _id: '1',
        title: 'Advanced Mathematics',
        description: 'Comprehensive guide to advanced mathematical concepts',
        author: 'Dr. John Smith',
        category: 'Mathematics',
        coverImageUrl: 'https://via.placeholder.com/300x400',
        pdfUrl: 'https://example.com/book1.pdf',
        pages: 250,
        isbn: '978-1234567890',
        status: 'published',
        is_featured: true,
        download_count: 150,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        _id: '2',
        title: 'Calculus Fundamentals',
        description: 'Learn calculus from the ground up',
        author: 'Prof. Jane Doe',
        category: 'Mathematics',
        coverImageUrl: 'https://via.placeholder.com/300x400',
        pdfUrl: 'https://example.com/book2.pdf',
        pages: 180,
        isbn: '978-0987654321',
        status: 'published',
        is_featured: false,
        download_count: 89,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/books/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      _id: req.params.id,
      title: 'Sample Book',
      description: 'This is a sample book',
      author: 'Sample Author',
      category: 'Mathematics',
      coverImageUrl: '',
      pdfUrl: '',
      pages: 100,
      isbn: '1234567890',
      status: 'published',
      is_featured: false,
      download_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Courses endpoints
app.get('/courses', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        _id: '1',
        title: 'Linear Algebra Masterclass',
        description: 'Complete course on linear algebra concepts and applications',
        instructor: 'Dr. Sarah Wilson',
        category: 'Mathematics',
        thumbnailUrl: 'https://via.placeholder.com/400x300',
        duration: 120,
        level: 'Intermediate',
        price: 299,
        status: 'published',
        is_featured: true,
        enrollment_count: 245,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        _id: '2',
        title: 'Statistics for Beginners',
        description: 'Learn statistical concepts from scratch',
        instructor: 'Prof. Michael Brown',
        category: 'Mathematics',
        thumbnailUrl: 'https://via.placeholder.com/400x300',
        duration: 90,
        level: 'Beginner',
        price: 199,
        status: 'published',
        is_featured: false,
        enrollment_count: 156,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/courses/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      _id: req.params.id,
      title: 'Sample Course',
      description: 'This is a sample course',
      instructor: 'Sample Instructor',
      category: 'Mathematics',
      thumbnailUrl: '',
      duration: 60,
      level: 'Beginner',
      price: 0,
      status: 'published',
      is_featured: false,
      enrollment_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Live Classes endpoints
app.get('/live-classes', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        _id: '1',
        title: 'Advanced Calculus Live Session',
        description: 'Interactive live session on advanced calculus topics',
        instructor: 'Dr. Emily Davis',
        category: 'Mathematics',
        thumbnailUrl: 'https://via.placeholder.com/400x300',
        startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endTime: new Date(Date.now() + 86400000 + 7200000).toISOString(), // Tomorrow + 2 hours
        status: 'upcoming',
        is_featured: true,
        enrollment_count: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        _id: '2',
        title: 'Algebra Basics Workshop',
        description: 'Fundamental algebra concepts explained live',
        instructor: 'Prof. Robert Johnson',
        category: 'Mathematics',
        thumbnailUrl: 'https://via.placeholder.com/400x300',
        startTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        endTime: new Date(Date.now() + 172800000 + 5400000).toISOString(), // Day after tomorrow + 1.5 hours
        status: 'upcoming',
        is_featured: false,
        enrollment_count: 32,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/live-classes/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      _id: req.params.id,
      title: 'Sample Live Class',
      description: 'This is a sample live class',
      instructor: 'Sample Instructor',
      category: 'Mathematics',
      thumbnailUrl: '',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      status: 'upcoming',
      is_featured: false,
      enrollment_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Search endpoint
app.get('/search', (req, res) => {
  res.json({
    success: true,
    data: {
      books: [],
      courses: [],
      liveClasses: []
    },
    query: req.query.q || '',
    timestamp: new Date().toISOString()
  });
});

// Featured content
app.get('/featured', (req, res) => {
  res.json({
    success: true,
    data: {
      books: [
        {
          _id: '1',
          title: 'Advanced Mathematics',
          description: 'Comprehensive guide to advanced mathematical concepts',
          author: 'Dr. John Smith',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x400',
          is_featured: true
        }
      ],
      courses: [
        {
          _id: '1',
          title: 'Linear Algebra Masterclass',
          description: 'Complete course on linear algebra concepts and applications',
          instructor: 'Dr. Sarah Wilson',
          category: 'Mathematics',
          thumbnailUrl: 'https://via.placeholder.com/400x300',
          is_featured: true
        }
      ],
      liveClasses: [
        {
          _id: '1',
          title: 'Advanced Calculus Live Session',
          description: 'Interactive live session on advanced calculus topics',
          instructor: 'Dr. Emily Davis',
          category: 'Mathematics',
          thumbnailUrl: 'https://via.placeholder.com/400x300',
          is_featured: true
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Categories
app.get('/categories', (req, res) => {
  res.json({
    success: true,
    data: {
      books: ['Mathematics', 'Physics', 'Chemistry'],
      courses: ['Mathematics', 'Physics', 'Chemistry'],
      liveClasses: ['Mathematics', 'Physics', 'Chemistry']
    },
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is working ✅',
    timestamp: new Date().toISOString()
  });
});

// Vercel serverless function handler
module.exports = (req, res) => {
  console.log('📱 Mobile serverless function called:', req.method, req.url);
  app(req, res);
};
