# Mathematico Backend API Connection Guide

## 🌐 Remote Server Connection

The Mathematico Backend API is deployed and running on Vercel:

**Base URL**: `https://mathematico-backend-new.vercel.app/api/v1`

## 🚀 Quick Connection Test

### Using Node.js Test Script
```bash
npm test
# or
node test-connection.js
```

### Using PowerShell (Windows)
```powershell
# Health Check
Invoke-WebRequest -Uri "https://mathematico-backend-new.vercel.app/api/v1/health" -Method GET

# API Info
Invoke-WebRequest -Uri "https://mathematico-backend-new.vercel.app/api/v1" -Method GET

# Courses
Invoke-WebRequest -Uri "https://mathematico-backend-new.vercel.app/api/v1/courses" -Method GET

# Books
Invoke-WebRequest -Uri "https://mathematico-backend-new.vercel.app/api/v1/books" -Method GET

# Authentication
$body = @{ email = "dc2006089@gmail.com"; password = "Myname*321" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://mathematico-backend-new.vercel.app/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json"
```

### Using curl (Linux/Mac)
```bash
# Health Check
curl https://mathematico-backend-new.vercel.app/api/v1/health

# API Info
curl https://mathematico-backend-new.vercel.app/api/v1

# Courses
curl https://mathematico-backend-new.vercel.app/api/v1/courses

# Books
curl https://mathematico-backend-new.vercel.app/api/v1/books

# Authentication
curl -X POST https://mathematico-backend-new.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dc2006089@gmail.com","password":"Myname*321"}'
```

## 📱 Mobile App Integration

### For React Native/Expo Apps
```javascript
const API_BASE_URL = 'https://mathematico-backend-new.vercel.app/api/v1';

// Health check
const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
};

// Get courses
const getCourses = async () => {
  const response = await fetch(`${API_BASE_URL}/courses`);
  return response.json();
};

// Login
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};
```

### For Web Apps
```javascript
const API_BASE_URL = 'https://mathematico-backend-new.vercel.app/api/v1';

// Using fetch API
fetch(`${API_BASE_URL}/health`)
  .then(response => response.json())
  .then(data => console.log(data));

// Using axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://mathematico-backend-new.vercel.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.get('/health').then(response => console.log(response.data));
```

## 🔧 Available Endpoints

### Health & Info
- `GET /api/v1/health` - API health status
- `GET /api/v1` - API information

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

## 🔐 Authentication

### Admin Credentials
- **Email**: `dc2006089@gmail.com`
- **Password**: `Myname*321`

### Token Usage
After successful login, include the token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

## 🌍 CORS Configuration

The API supports CORS for:
- Web frontend domains (Vercel deployments)
- Expo development servers (`exp://` URLs)
- Android emulator (`10.0.2.2`)
- iOS simulator (`localhost`)
- Production mobile app domains

## 📊 Status Monitoring

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-09-18T19:19:32.119Z",
  "environment": "production",
  "vercel": true,
  "version": "1.4.0"
}
```

### API Info Response
```json
{
  "status": "Mathematico API v1 running",
  "message": "Mathematico API v1 - ROUTING FIXED",
  "version": "1.5.0",
  "timestamp": "2025-09-18T19:19:41.877Z",
  "environment": "production",
  "vercel": true,
  "deployment": "api.js - ROUTING FIXED",
  "fix": "api-v1-endpoint-routing-resolved",
  "endpoints": {
    "health": "/api/v1/health",
    "auth": "/api/v1/auth",
    "books": "/api/v1/books",
    "courses": "/api/v1/courses",
    "liveClasses": "/api/v1/live-classes",
    "admin": "/api/v1/admin",
    "enrollments": "/api/v1/enrollments",
    "users": "/api/v1/users",
    "payments": "/api/v1/payments"
  }
}
```

## 🚨 Troubleshooting

### Connection Issues
1. **Check internet connection**
2. **Verify URL**: Ensure you're using the correct base URL
3. **Check CORS**: Make sure your origin is allowed
4. **Test health endpoint**: Start with `/api/v1/health`

### Common Errors
- **404 Not Found**: Check the endpoint URL
- **CORS Error**: Verify your origin is in the allowed list
- **401 Unauthorized**: Check your authentication token
- **500 Internal Server Error**: Check the server logs

### Support
If you encounter issues:
1. Run the connection test: `npm test`
2. Check the health endpoint
3. Verify your request format
4. Check the API documentation

## 🎯 Next Steps

1. **Test Connection**: Run `npm test` to verify connectivity
2. **Integrate with Mobile App**: Use the provided code examples
3. **Set up Authentication**: Implement login/logout functionality
4. **Test All Endpoints**: Verify all required endpoints work
5. **Monitor Performance**: Use health checks for monitoring
