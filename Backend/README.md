# Mathematico Backend API

> Production-ready educational platform backend with comprehensive API documentation and testing tools

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
- Health Check: `/api/v1/health`

### Exported Documentation
- `docs/swagger.json` - OpenAPI 3.0 specification
- `docs/openapi.yaml` - YAML format for OpenAPI tools
- `docs/Mathematico_API.postman_collection.json` - Complete Postman collection
- `docs/API_DOCUMENTATION.md` - Human-readable documentation

### Testing Tools
1. **Postman Collection**: Import the JSON file for comprehensive API testing
2. **Swagger UI**: Visit `/api-docs` for interactive testing
3. **Health Check**: Monitor service status at `/api/v1/health`

## Features Implemented

### Core Functionality
- Complete CRUD Operations for all entities
- Database Integration with MySQL + fallback data
- JWT Authentication with refresh tokens
- File Upload Support with validation
- Status Management for all entities
- Pagination & Search for all list endpoints

### Serverless Optimization
- Vercel Compatibility with conditional features
- Cold Start Optimization with lazy initialization
- Error Boundaries to prevent function crashes
- Timeout Protection for database operations

### Security & Production Features
- Helmet Security Headers (environment-aware)
- Rate Limiting (general + auth-specific)
- CORS Configuration for cross-origin requests
- Input Validation and error handling
- Structured Logging with Winston

### Mobile Compatibility
- Absolute File URLs for mobile apps
- CORS Headers for mobile requests
- Consistent Response Format across all endpoints
- Mock Data Fallbacks for development

## API Endpoints Overview

### System (Public)
- `GET /` - API information
- `GET /api/v1/health` - Health check with metrics
- `GET /api-docs` - Interactive documentation

### Authentication (Rate Limited)
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/auth/profile` - User profile

### Mobile (Public)
- `GET /api/v1/mobile/courses` - Course catalog
- `GET /api/v1/mobile/books` - Book catalog
- `GET /api/v1/mobile/live-classes` - Live class schedule

### Admin (JWT + Admin Role Required)
- Books: Full CRUD + status management
- Courses: Full CRUD + status management
- Live Classes: Full CRUD + status management
- Users: Full CRUD + status management
- File Upload: Generic file upload endpoint

## Project Status: COMPLETE

The Mathematico backend is now enterprise-ready with robust architecture, production security, comprehensive monitoring, complete documentation, mobile optimization, and testing tools.

Ready for production deployment and team development!