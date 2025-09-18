# Mathematico Backend API

A clean, serverless backend API for the Mathematico mathematics learning platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📁 Project Structure

```
Backend/
├── api/
│   ├── index.js          # Main API server
│   └── v1/
│       └── index.js      # Fallback API handler
├── config.env            # Environment configuration
├── vercel.json           # Vercel deployment config
├── package.json          # Dependencies
└── README.md             # This file
```

## 🔗 API Endpoints

### Health Check
- `GET /api/v1/health` - API health status

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Courses
- `GET /api/v1/courses` - List all courses
- `GET /api/v1/courses/:id` - Get course details
- `POST /api/v1/courses/:id/enroll` - Enroll in course
- `GET /api/v1/courses/my-courses` - Get user's courses

### Books
- `GET /api/v1/books` - List all books
- `GET /api/v1/books/:id` - Get book details
- `POST /api/v1/books/:id/purchase` - Purchase book
- `GET /api/v1/books/my-books` - Get user's books

### Live Classes
- `GET /api/v1/live-classes` - List all live classes
- `GET /api/v1/live-classes/:id` - Get live class details
- `POST /api/v1/live-classes/:id/join` - Join live class
- `GET /api/v1/live-classes/my-classes` - Get user's classes

### Admin
- `GET /api/v1/admin/dashboard` - Admin dashboard stats
- `GET /api/v1/admin/courses` - Admin course management
- `GET /api/v1/admin/books` - Admin book management
- `GET /api/v1/admin/live-classes` - Admin live class management
- `GET /api/v1/admin/users` - Admin user management

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret

## 📱 Mobile Integration

The API is optimized for mobile app connectivity:

- **Base URL**: `https://mathematico-backend-new.vercel.app/api/v1`
- **CORS**: Configured for mobile apps and web frontend
- **Health Check**: `/api/v1/health` for connectivity testing

## 🧪 Testing

Run the health check script:
```bash
./test-health.sh
```

Or test manually:
```bash
curl https://mathematico-backend-new.vercel.app/api/v1/health
```

## 📄 License

MIT License - see LICENSE file for details