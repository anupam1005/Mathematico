// Vercel serverless function for student endpoints
const express = require('express');
const cors = require('cors');

const app = express();

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

// Root student endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student API is working ✅',
    endpoints: {
      courses: '/courses',
      books: '/books',
      liveClasses: '/live-classes',
      progress: '/progress',
      notifications: '/notifications',
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
    message: 'Student service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Student API is working ✅',
    timestamp: new Date().toISOString()
  });
});

// Courses endpoints
app.get('/courses', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
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

// Books endpoints
app.get('/books', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
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

// Live classes endpoints
app.get('/live-classes', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
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

// Progress endpoints
app.get('/progress', (req, res) => {
  res.json({
    success: true,
    data: {
      coursesCompleted: 0,
      booksRead: 0,
      liveClassesAttended: 0,
      totalStudyTime: 0
    },
    timestamp: new Date().toISOString()
  });
});

// Notifications endpoints
app.get('/notifications', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    },
    timestamp: new Date().toISOString()
  });
});

// Vercel serverless function handler
module.exports = (req, res) => {
  app(req, res);
};
