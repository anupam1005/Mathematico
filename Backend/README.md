# Mathematico Backend API

> Simplified educational platform backend with admin authentication only

**⚠️ IMPORTANT: Database functionality has been removed from this project. Only admin authentication is available.**

## Quick Start

### Local Development
```bash
cd Backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

### Production Deployment (Vercel)
```bash
vercel --prod
# Deployed to https://your-domain.vercel.app
```

## Documentation & Testing

### Live API Documentation
- Interactive Swagger UI: `/api-docs`
- JSON Schema: `/api-docs.json`
- Health Check: `/health`

### Testing Tools
1. **Swagger UI**: Visit `/api-docs` for interactive testing
2. **Health Check**: Monitor service status at `/health`
3. **Admin Login**: Test authentication at `/api/v1/auth/login`

## Features Implemented

### Core Functionality
- ✅ Admin Authentication with JWT
- ✅ Token refresh mechanism
- ✅ Health monitoring
- ✅ API documentation
- ❌ Database Integration (removed)
- ❌ CRUD Operations (disabled)
- ❌ File Upload (disabled)
- ❌ User Management (disabled)

### Serverless Optimization
- ✅ Vercel Compatibility
- ✅ Cold Start Optimization
- ✅ Error Boundaries
- ✅ Timeout Protection

### Security & Production Features
- ✅ Helmet Security Headers
- ✅ Rate Limiting
- ✅ CORS Configuration
- ✅ Input Validation
- ✅ Structured Logging

### Mobile Compatibility
- ✅ CORS Headers for mobile requests
- ✅ Consistent Response Format
- ✅ Empty data fallbacks

## API Endpoints Overview

### System (Public)
- `GET /` - API information
- `GET /health` - Health check with metrics
- `GET /api-docs` - Interactive documentation

### Authentication (Rate Limited)
- `POST /api/v1/auth/login` - Admin login only
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/auth/profile` - User profile (admin only)
- ❌ `POST /api/v1/auth/register` - Disabled

### Mobile (Public - Returns Empty Data)
- `GET /api/v1/mobile/courses` - Returns empty array
- `GET /api/v1/mobile/books` - Returns empty array
- `GET /api/v1/mobile/live-classes` - Returns empty array
- `GET /api/v1/mobile/featured` - Returns empty data
- `GET /api/v1/mobile/info` - Returns app info

### Admin (JWT + Admin Role Required)
- `GET /api/v1/admin/dashboard` - Returns empty stats
- `GET /api/v1/admin/info` - Returns admin info
- ❌ All CRUD operations disabled
- ❌ File upload disabled
- ❌ User management disabled

## Environment Variables

Create a `.env` file in the `Backend/` directory:

```bash
# Authentication
JWT_SECRET=your_jwt_secret_minimum_64_characters
JWT_REFRESH_SECRET=your_refresh_secret_minimum_64_characters

# Admin Credentials
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_secure_admin_password

# Cloudinary (for future file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Project Status: SIMPLIFIED

The Mathematico backend has been simplified to remove all database functionality:

### ✅ Available Features
- Admin authentication
- JWT token management
- Health monitoring
- API documentation
- Basic mobile endpoints (empty data)

### ❌ Removed Features
- Database connections
- User registration
- Course management
- Book management
- Live class management
- Payment processing
- File uploads
- Data persistence

## Testing

### Test Admin Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your_admin_email","password":"your_admin_password"}'
```

### Test Health Check
```bash
curl http://localhost:5000/health
```

### Test API Info
```bash
curl http://localhost:5000/api/v1/admin/info
```

## Security Notes

- Only admin authentication is available
- No user registration or management
- All data endpoints return empty arrays
- CRUD operations are disabled
- File uploads are disabled
- Database connections are removed

## Migration Notes

If you need to restore database functionality:
1. Add MongoDB connection
2. Restore model files
3. Update controllers to use database
4. Re-enable CRUD operations
5. Update environment variables

---

**Ready for basic admin authentication and API testing!**