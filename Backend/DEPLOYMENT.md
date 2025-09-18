# Mathematico Backend API Deployment Guide

## Vercel Deployment

### Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Vercel account
- Node.js 18+

### Deployment Steps

1. **Install Dependencies**
   ```bash
   cd Backend
   npm install
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Environment Variables**
   Set these in Vercel dashboard:
   - `NODE_ENV=production`
   - `VERCEL=1`

### API Endpoints

The API will be available at: `https://mathematico-backend-new.vercel.app/api/v1`

#### Available Endpoints:
- `GET /api/v1` - API information
- `GET /api/v1/health` - Health check
- `POST /api/v1/admin/books` - Create book
- `POST /api/v1/admin/courses` - Create course
- `POST /api/v1/admin/live-classes` - Create live class
- `GET /api/v1/books` - Get books
- `GET /api/v1/courses` - Get courses
- `GET /api/v1/live-classes` - Get live classes

### Testing the API

1. **Test API Health**
   ```bash
   curl https://mathematico-backend-new.vercel.app/api/v1/health
   ```

2. **Test Book Creation**
   ```bash
   curl -X POST https://mathematico-backend-new.vercel.app/api/v1/admin/books \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Book","author":"Test Author","description":"Test Description"}'
   ```

### Troubleshooting

If you get 404 errors:
1. Check that `vercel.json` is in the Backend directory
2. Ensure `api/index.js` exists and is valid
3. Verify the deployment in Vercel dashboard
4. Check Vercel function logs for errors

### File Structure
```
Backend/
├── api.js                # Main API file (Vercel entry point)
├── api/
│   └── index.js          # Alternative API file
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
└── DEPLOYMENT.md         # This file
```

## Mobile Connectivity & API Endpoints

### API Base URL
- **Production**: `https://mathematico-backend-new.vercel.app/api/v1`
- **Development**: `http://localhost:5000/api/v1` (local server)
- **Android Emulator**: `http://10.0.2.2:5000/api/v1`
- **iOS Simulator**: `http://localhost:5000/api/v1`

### Health Check Endpoint
- **URL**: `/api/v1/health`
- **Method**: GET
- **Response**: JSON with API status, version, and mobile connectivity info
- **Purpose**: Mobile app connectivity testing and API validation

### Available Endpoints
- **Authentication**: `/api/v1/auth/*` (login, register, refresh, logout)
- **Courses**: `/api/v1/courses` (list, details, enrollment)
- **Books**: `/api/v1/books` (list, details, purchase)
- **Live Classes**: `/api/v1/live-classes` (list, details, join)
- **Admin**: `/api/v1/admin/*` (dashboard, management)
- **Users**: `/api/v1/users` (profile management)
- **Payments**: `/api/v1/payments` (payment processing)

### CORS Configuration
The API supports CORS for:
- Web frontend domains (Vercel deployments)
- Expo development servers (`exp://` URLs)
- Android emulator (`10.0.2.2`)
- iOS simulator (`localhost`)
- Production mobile app domains

### Fallback Handler
- **File**: `api/v1/index.js`
- **Purpose**: Ensures `/api/v1` endpoints work even if main server fails
- **Features**: Basic endpoints, health checks, mobile-optimized responses

### Environment Variables (Vercel)
Ensure these are set in Vercel project settings:
- `NODE_ENV=production`
- `JWT_SECRET` (for authentication)
- `JWT_REFRESH_SECRET` (for refresh tokens)
- Database connection variables (if using external DB)

### Testing
Run the health check script:
```bash
./test-health.sh
```

Or test manually:
```bash
curl https://mathematico-backend-new.vercel.app/api/v1/health
```