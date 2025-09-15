# 🚀 Mathematico Project Setup Guide

This guide will help you set up both the backend and frontend to eliminate 404 errors and ensure proper connectivity.

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **Git** (for cloning the repository)

## 🗄️ Database Setup

### 1. Start MySQL Service
```bash
# Windows (if using XAMPP/WAMP)
# Start MySQL service from your control panel

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

### 2. Create Database
```sql
CREATE DATABASE mathematico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Create User (Optional)
```sql
CREATE USER 'mathematico_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON mathematico.* TO 'mathematico_user'@'localhost';
FLUSH PRIVILEGES;
```

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy the example environment file and update it:
```bash
cp config.env.example config.env
```

Edit `config.env` with your database credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=mathematico

# JWT Configuration
JWT_SECRET=your-super-secret-access-key-here-make-it-long-and-random
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-make-it-different-and-random

# Admin Configuration
ADMIN_EMAIL=dc2006089@gmail.com
ADMIN_PASSWORD=Myname*321
```

### 4. Create Uploads Directory
```bash
mkdir uploads
```

### 5. Start Backend Server
```bash
# Using the provided script (Windows)
start-backend.bat

# Using the provided script (PowerShell)
start-backend.ps1

# Or manually
npm run dev
```

**Expected Output:**
```
✅ Database connection established
🚀 Server is running on port 5000
📚 API Documentation: http://localhost:5000/api/v1/health (or https://mathematico-backend-new.vercel.app/api/v1/health for production)
🌐 Frontend URL: http://localhost:8080
🗄️  Database: mathematico
👤 Admin Email: dc2006089@gmail.com
```

### 6. Test Backend Connectivity
```bash
node test-backend-connection.js
```

**Expected Output:**
```
🚀 Starting Mathematico Backend Connectivity Test...

🧪 Testing backend connection...
📍 Testing endpoint: http://localhost:5000/api/v1/health
✅ Status: 200
📋 Headers: {...}
📊 Response: {"status":"healthy","timestamp":"...","uptime":...}

🔐 Testing admin endpoint...
📍 Testing endpoint: http://localhost:5000/api/v1/admin/books
✅ Admin endpoint status: 401
💡 Expected: 401 (Unauthorized) - This means the endpoint exists and auth middleware is working

📚 Testing book creation endpoint...
📍 Testing endpoint: http://localhost:5000/api/v1/admin/books (POST)
✅ Book creation endpoint status: 401
💡 Expected: 401 (Unauthorized) - This means the endpoint exists and auth middleware is working

🎉 Backend connectivity test completed!
📋 Summary:
   ✅ Health endpoint: Working
   ✅ Admin routes: Working
   ✅ Authentication: Working
   ✅ File uploads: Ready

🚀 Your backend is ready to accept requests!
```

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd Frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy the example environment file and update it:
```bash
cp config.env.example config.env
```

Edit `config.env`:
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1
VITE_API_TIMEOUT=10000

# Token Configuration
VITE_TOKEN_REFRESH_INTERVAL=840000

# App Configuration
VITE_APP_NAME=Mathematico
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true

# Backend Configuration
VITE_BACKEND_URL=http://localhost:5000
VITE_BACKEND_HEALTH_CHECK=/api/v1/health

# Frontend Port (for reference)
VITE_FRONTEND_PORT=8080
```

### 4. Start Frontend Development Server
```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

## 🔍 Testing the Setup

### 1. Backend Health Check
Open your browser and navigate to:
```
http://localhost:5000/api/v1/health
```
Or for production: `https://mathematico-backend-new.vercel.app/api/v1/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX...",
  "uptime": X.XX,
  "environment": "development"
}
```

### 2. Frontend Backend Status
- Open `http://localhost:5173/admin` (or https://mathematico-frontend.vercel.app/admin for production)
- Log in with admin credentials
- Check the "Backend Status" card on the dashboard
- It should show "Online" with a green checkmark

### 3. Test Book Creation
- Navigate to Admin → Books → Create Book
- Fill in the form and submit
- You should see a success message
- The book should appear in the Books list

## 🚨 Troubleshooting

### Backend Won't Start

**Error: "Cannot connect to database"**
```bash
# Check if MySQL is running
mysql -u root -p

# Verify database exists
SHOW DATABASES;

# Check credentials in config.env
cat config.env
```

**Error: "Port 5000 already in use"**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F
```

### Frontend Can't Connect to Backend

**Error: "Network error"**
1. Ensure backend is running on port 5000
2. Check `VITE_API_URL` in `Frontend/config.env`
3. Verify CORS settings in backend
4. Check browser console for detailed errors

**Error: "404 Not Found"**
1. Verify backend routes are properly mounted
2. Check if `/api/v1/health` endpoint responds
3. Ensure all route files are properly imported
4. Check backend console for route registration logs

### Authentication Issues

**Error: "401 Unauthorized"**
1. Verify JWT secrets in `Backend/config.env`
2. Check if admin user exists in database
3. Ensure token is being sent in Authorization header
4. Check browser localStorage for valid tokens

## 📱 API Endpoints Reference

### Public Endpoints
- `GET /api/v1/health` - Health check
- `GET /api/v1/books` - Get published books
- `GET /api/v1/courses` - Get published courses
- `GET /api/v1/live-classes` - Get published live classes

### Protected Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/profile` - Get user profile

### Admin Endpoints
- `GET /api/v1/admin/dashboard` - Admin dashboard
- `GET /api/v1/admin/books` - Get all books (admin)
- `POST /api/v1/admin/books` - Create book (admin)
- `PUT /api/v1/admin/books/:id` - Update book (admin)
- `DELETE /api/v1/admin/books/:id` - Delete book (admin)
- `PATCH /api/v1/admin/books/:id/publish` - Toggle book publish status

## 🔐 Default Admin Credentials

- **Email:** dc2006089@gmail.com
- **Password:** Myname*321

## 📁 Project Structure

```
Mathematico/
├── Backend/                 # Backend server
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── entities/       # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & validation
│   │   └── config/         # Database & server config
│   ├── uploads/            # File uploads
│   └── config.env          # Environment variables
├── Frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── lib/            # Utilities & config
│   └── config.env          # Frontend environment
└── PROJECT_SETUP.md        # This file
```

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** in both backend and frontend consoles
2. **Verify all prerequisites** are installed and running
3. **Test connectivity** using the provided test scripts
4. **Check environment variables** are properly configured
5. **Ensure database** is running and accessible

## 🎯 Next Steps

Once everything is working:

1. **Create your first book** through the admin panel
2. **Test the "Push to Public" workflow**
3. **Explore other admin features** (courses, live classes, users)
4. **Customize the application** for your needs

---

**Happy coding! 🚀**
