# Mathematico - Real Data Implementation

This document provides instructions for running the Mathematico application with real data instead of fallback/mock data.

## Overview

The application has been updated to remove all fallback data and implement proper database operations. The backend now uses MongoDB for data persistence, and the frontend services have been updated to handle real API responses.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- Android development environment (for mobile app)

## Backend Setup

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the Backend directory with the following variables:

```env
# Database
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/mathematico?retryWrites=true&w=majority
MONGODB_DB=mathematico

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Admin Credentials
ADMIN_EMAIL=dc2006089@gmail.com
ADMIN_PASSWORD=Myname*321
```

### 3. Seed Sample Data

Run the data seeding script to populate the database with sample courses, books, live classes, and users:

```bash
npm run seed
```

This will create:
- 1 Admin user (dc2006089@gmail.com / Myname*321)
- 2 Sample students (john@example.com, jane@example.com / password123)
- 2 Sample courses (Advanced Calculus, Basic Algebra)
- 2 Sample books (Mathematics for Class 10, Physics Fundamentals)
- 2 Sample live classes (Live Calculus Session, Algebra Basics Live)

### 4. Start the Backend Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will be available at `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd Frontend-app
npm install
```

### 2. Update API Configuration

Update the API configuration in `Frontend-app/src/config.ts` to point to your backend:

```typescript
export const API_CONFIG = {
  mobile: 'http://localhost:5000/api/mobile',
  admin: 'http://localhost:5000/api/admin',
  auth: 'http://localhost:5000/api/auth',
  student: 'http://localhost:5000/api/student',
  payment: 'http://localhost:5000/api/payment',
};
```

### 3. Start the Mobile App

```bash
# For Android
npx react-native run-android

# For iOS (if on macOS)
npx react-native run-ios
```

## Features Now Available

### Student Features
- ✅ User registration and login
- ✅ Browse courses, books, and live classes
- ✅ Enroll in courses
- ✅ Purchase books
- ✅ Join live classes
- ✅ Track learning progress
- ✅ View certificates
- ✅ Update profile

### Admin Features
- ✅ Admin login (dc2006089@gmail.com / Myname*321)
- ✅ Create, update, delete courses
- ✅ Create, update, delete books
- ✅ Create, update, delete live classes
- ✅ Manage users
- ✅ View dashboard statistics
- ✅ Upload course materials and book PDFs

### Real Data Features
- ✅ MongoDB database integration
- ✅ User authentication with JWT tokens
- ✅ Course enrollment tracking
- ✅ Book purchase tracking
- ✅ Live class enrollment
- ✅ Progress tracking
- ✅ File uploads (thumbnails, PDFs, videos)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Student Endpoints
- `GET /api/student/courses` - Get available courses
- `POST /api/student/courses/:id/enroll` - Enroll in course
- `GET /api/student/books` - Get available books
- `POST /api/student/books/:id/purchase` - Purchase book
- `GET /api/student/live-classes` - Get live classes
- `POST /api/student/live-classes/:id/enroll` - Enroll in live class
- `GET /api/student/progress` - Get learning progress
- `GET /api/student/certificates` - Get certificates

### Admin Endpoints
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/courses` - Get all courses
- `POST /api/admin/courses` - Create course
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course
- `GET /api/admin/books` - Get all books
- `POST /api/admin/books` - Create book
- `PUT /api/admin/books/:id` - Update book
- `DELETE /api/admin/books/:id` - Delete book
- `GET /api/admin/live-classes` - Get all live classes
- `POST /api/admin/live-classes` - Create live class
- `PUT /api/admin/live-classes/:id` - Update live class
- `DELETE /api/admin/live-classes/:id` - Delete live class

## Database Schema

### Users Collection
- Basic user information (name, email, password)
- Role (student, admin, teacher)
- Profile information (grade, school, subjects)
- Enrollment and purchase tracking
- Preferences and settings

### Courses Collection
- Course details (title, description, curriculum)
- Instructor information
- Pricing and enrollment data
- Student progress tracking
- Reviews and ratings

### Books Collection
- Book details (title, author, publisher)
- File information (PDF, cover image)
- Purchase tracking
- Download statistics

### Live Classes Collection
- Class details (title, description, schedule)
- Instructor information
- Meeting links and credentials
- Enrollment tracking

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MongoDB URI in `.env` file
   - Check network connectivity to MongoDB Atlas
   - Ensure database user has proper permissions

2. **Authentication Issues**
   - Verify JWT_SECRET is set in environment
   - Check token expiration settings
   - Clear app storage and re-login

3. **File Upload Issues**
   - Check file size limits
   - Verify file type restrictions
   - Ensure proper permissions for upload directories

4. **API Connection Issues**
   - Verify backend server is running
   - Check API configuration in frontend
   - Ensure CORS settings allow frontend requests

### Logs

Backend logs are available in the console when running `npm run dev`. For production, logs are written to files in the `logs/` directory.

## Development Notes

- All fallback data has been removed
- Database operations are properly implemented
- Error handling includes proper HTTP status codes
- File uploads are handled with proper validation
- Authentication uses secure JWT tokens with refresh mechanism

## Next Steps

1. Add more sample data as needed
2. Implement additional features like notifications
3. Add payment integration
4. Implement real-time features for live classes
5. Add analytics and reporting features
