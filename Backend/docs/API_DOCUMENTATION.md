# Mathematico Backend API Documentation

## 🚀 Quick Start

### Base URLs
- **Production**: `https://mathematico-backend-new.vercel.app`
- **Local Development**: `http://localhost:5000`

### Authentication
All admin routes require JWT Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### API Documentation
- **Interactive Docs**: `/api-docs`
- **JSON Schema**: `/api-docs.json`
- **Health Check**: `/api/v1/health`

---

## 📋 API Endpoints Overview

### 🏥 System Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API root information | No |
| GET | `/api/v1` | API v1 information | No |
| GET | `/api/v1/health` | Health check with monitoring | No |
| GET | `/api-docs` | Interactive API documentation | No |

### 🔐 Authentication Endpoints
| Method | Endpoint | Description | Rate Limited |
|--------|----------|-------------|--------------|
| POST | `/api/v1/auth/login` | User login | Yes (5/15min) |
| POST | `/api/v1/auth/register` | User registration | Yes (5/15min) |
| POST | `/api/v1/auth/refresh` | Refresh JWT token | No |
| POST | `/api/v1/auth/logout` | User logout | No |
| GET | `/api/v1/auth/profile` | Get user profile | JWT Required |

### 📱 Mobile Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/mobile/test` | Mobile API test | No |
| GET | `/api/v1/mobile/courses` | Get courses for mobile | No |
| GET | `/api/v1/mobile/books` | Get books for mobile | No |
| GET | `/api/v1/mobile/live-classes` | Get live classes for mobile | No |
| POST | `/api/v1/mobile/courses/:id/enroll` | Enroll in course | No |
| POST | `/api/v1/mobile/books/:id/purchase` | Purchase book | No |
| POST | `/api/v1/mobile/live-classes/:id/enroll` | Enroll in live class | No |

### 📊 Admin - Dashboard
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/admin/dashboard` | Get dashboard statistics | JWT + Admin |

### 📚 Admin - Books
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/admin/books` | List books (paginated) | JWT + Admin |
| POST | `/api/v1/admin/books` | Create book (with file upload) | JWT + Admin |
| PUT | `/api/v1/admin/books/:id` | Update book (with file upload) | JWT + Admin |
| PUT | `/api/v1/admin/books/:id/status` | Update book status | JWT + Admin |
| DELETE | `/api/v1/admin/books/:id` | Delete book | JWT + Admin |

### 🎓 Admin - Courses
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/admin/courses` | List courses (paginated) | JWT + Admin |
| POST | `/api/v1/admin/courses` | Create course (with file upload) | JWT + Admin |
| PUT | `/api/v1/admin/courses/:id` | Update course (with file upload) | JWT + Admin |
| PUT | `/api/v1/admin/courses/:id/status` | Update course status | JWT + Admin |
| DELETE | `/api/v1/admin/courses/:id` | Delete course | JWT + Admin |

### 🎥 Admin - Live Classes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/admin/live-classes` | List live classes (paginated) | JWT + Admin |
| POST | `/api/v1/admin/live-classes` | Create live class (with file upload) | JWT + Admin |
| PUT | `/api/v1/admin/live-classes/:id` | Update live class (with file upload) | JWT + Admin |
| PUT | `/api/v1/admin/live-classes/:id/status` | Update live class status | JWT + Admin |
| DELETE | `/api/v1/admin/live-classes/:id` | Delete live class | JWT + Admin |

### 👥 Admin - Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/admin/users` | List users (paginated) | JWT + Admin |
| POST | `/api/v1/admin/users` | Create user | JWT + Admin |
| PUT | `/api/v1/admin/users/:id` | Update user | JWT + Admin |
| PUT | `/api/v1/admin/users/:id/status` | Update user status | JWT + Admin |
| DELETE | `/api/v1/admin/users/:id` | Delete user | JWT + Admin |

### 📁 Admin - File Upload
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/admin/upload` | Upload file | JWT + Admin |

---

## 🔧 Request/Response Examples

### Authentication

#### Login Request
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "dc2006089@gmail.com",
  "password": "Myname*321"
}
```

#### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "dc2006089@gmail.com",
      "name": "Admin User",
      "role": "admin",
      "isAdmin": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

### Book Management

#### Create Book Request
```bash
POST /api/v1/admin/books
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

title: "Advanced Calculus"
author: "Dr. John Smith"
description: "Comprehensive calculus textbook"
category: "Mathematics"
pages: 450
isbn: "978-1234567890"
status: "draft"
coverImage: <file>
pdfFile: <file>
```

#### Create Book Response
```json
{
  "success": true,
  "message": "Book created successfully",
  "data": {
    "id": 1,
    "title": "Advanced Calculus",
    "author": "Dr. John Smith",
    "description": "Comprehensive calculus textbook",
    "category": "Mathematics",
    "pages": 450,
    "isbn": "978-1234567890",
    "status": "draft",
    "is_published": false,
    "cover_image_url": "https://mathematico-backend-new.vercel.app/uploads/covers/coverImage-1234567890.jpg",
    "pdf_url": "https://mathematico-backend-new.vercel.app/uploads/pdfs/pdfFile-1234567890.pdf",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Status Updates

#### Update Book Status
```bash
PUT /api/v1/admin/books/1/status
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "active"
}
```

#### Status Update Response
```json
{
  "success": true,
  "message": "Book 1 status updated to active",
  "data": {
    "id": 1,
    "status": "active",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 📊 Query Parameters

### Pagination
All list endpoints support pagination:
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 10) - Items per page

### Filtering
- `category` (string) - Filter by category
- `search` (string) - Search in title/description
- `role` (string) - Filter users by role
- `status` (string) - Filter by status

### Example
```
GET /api/v1/admin/books?page=2&limit=20&category=Mathematics&search=calculus
```

---

## 🔒 Status Values

### Book Status
- `draft` - Not published
- `active` - Published and available
- `archived` - Archived/hidden

### Course Status  
- `draft` - Not published
- `active` - Published and available
- `archived` - Archived/hidden

### Live Class Status
- `draft` - Not scheduled
- `scheduled` - Scheduled for future
- `live` - Currently happening
- `completed` - Finished
- `cancelled` - Cancelled

### User Status
- `is_active: true` - Active user
- `is_active: false` - Inactive/suspended user

---

## 🚨 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (admin access required)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable (health check failed)

---

## 🔧 Testing Tools

### Postman Collection
Import the collection: `Backend/docs/Mathematico_API.postman_collection.json`

**Features:**
- ✅ Pre-configured environments (production/local)
- ✅ Automatic token management
- ✅ All endpoints with example requests
- ✅ File upload examples
- ✅ Error handling tests

### Swagger UI
Visit `/api-docs` for interactive API testing:
- ✅ Try endpoints directly in browser
- ✅ Authentication support
- ✅ Request/response examples
- ✅ Schema documentation

---

## 🌐 Environment Variables

### Required
```env
# Database
DB_HOST=your-db-host
DB_PORT=your-db-port
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=your-db-name

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# URLs
BACKEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
```

### Optional
```env
# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

---

## 🎯 Testing Workflow

### 1. **Setup**
1. Import Postman collection
2. Set environment variables (production/local)
3. Test health check endpoint

### 2. **Authentication**
1. Use "Login (Admin)" request
2. Tokens automatically saved to variables
3. All subsequent requests use saved token

### 3. **CRUD Testing**
1. Create entities (books/courses/live classes)
2. List entities with pagination
3. Update entities and status
4. Delete entities

### 4. **File Upload Testing**
1. Test generic file upload
2. Test entity creation with files
3. Verify absolute URLs in responses

### 5. **Mobile API Testing**
1. Test mobile endpoints (no auth required)
2. Test enrollment/purchase flows
3. Verify response format compatibility

---

## 📈 Monitoring

### Health Check Response
```json
{
  "success": true,
  "message": "Mathematico Backend API is healthy ✅",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "2.0.0",
  "serverless": true,
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": "45ms"
    },
    "memory": {
      "used": 128,
      "total": 256,
      "unit": "MB"
    }
  }
}
```

### Monitoring Integration
- **Status Code**: 200 (healthy) / 503 (unhealthy)
- **Response Time**: Database connection timing
- **Memory Usage**: Current memory consumption
- **Uptime**: Server uptime in seconds

---

## 🔗 Integration Examples

### Frontend Integration
```javascript
// Using the adminService
import adminService from './services/adminService';

// Get all books
const books = await adminService.getAllBooks();

// Update book status
await adminService.updateBookStatus('1', 'active');

// Create course with file
const formData = new FormData();
formData.append('title', 'New Course');
formData.append('price', '99.99');
formData.append('image', imageFile);
await adminService.createCourse(formData);
```

### Mobile App Integration
```javascript
// Fetch courses for mobile
const response = await fetch(`${API_BASE}/api/v1/mobile/courses`);
const courses = await response.json();

// Enroll in course
await fetch(`${API_BASE}/api/v1/mobile/courses/1/enroll`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ paymentMethod: 'card', amount: 99.99 })
});
```

---

## 🎉 Features Implemented

### ✅ **Complete CRUD Operations**
- Books, Courses, Live Classes, Users
- Pagination, search, filtering
- Status management for all entities

### ✅ **File Upload Support**
- Organized directory structure
- File type validation
- Size limits (10MB)
- Absolute URLs for mobile compatibility

### ✅ **Security Features**
- JWT authentication & authorization
- Rate limiting (general + auth-specific)
- Helmet security headers
- Admin role validation

### ✅ **Production Ready**
- Serverless optimization (Vercel)
- Database integration with fallback
- Comprehensive error handling
- Health monitoring with metrics

### ✅ **Developer Experience**
- Interactive Swagger documentation
- Postman collection with auto-token management
- Comprehensive logging
- Clear error messages

### ✅ **Mobile Compatibility**
- Absolute file URLs
- CORS configuration
- Consistent response format
- Mock data for development

---

## 🚀 Deployment

### Vercel Deployment
```bash
cd Backend
vercel --prod
```

### Local Development
```bash
cd Backend
npm install
npm run dev
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure database credentials
3. Set JWT secrets
4. Update CORS origins

---

## 📞 Support

For API support or questions:
- **Documentation**: Visit `/api-docs` on your deployed instance
- **Health Check**: Monitor `/api/v1/health`
- **Postman Collection**: Import for easy testing
- **Logs**: Check server logs for detailed error information

**The API is now production-ready with enterprise-grade documentation, monitoring, and testing tools!** 🎉
