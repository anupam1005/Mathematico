# Mathematico Unified Backend

A unified backend API that supports both the Mobile Application (React Native) and Admin Panel frontend.

## 🏗️ Architecture

```
Backend/
├── api/
│   ├── mobile/          # Mobile API routes (React Native app)
│   ├── admin/           # Admin API routes (Admin panel)
│   └── shared/          # Shared API routes (Auth, profile, etc.)
├── controllers/
│   ├── mobileController.js
│   ├── adminController.js
│   ├── authController.js
│   └── profileController.js
├── models/
│   ├── User.js
│   ├── Course.js
│   └── LiveClass.js
├── middlewares/
│   └── auth.js
├── database.js
├── server.js
├── config.env
├── package.json
└── vercel.json
```

## 🚀 API Endpoints

### Mobile API (`/api/v1/mobile/`)
- **Courses**: `GET /courses`, `GET /courses/:id`, `POST /courses/:id/enroll`
- **Books**: `GET /books`, `GET /books/:id`, `POST /books/:id/purchase`
- **Live Classes**: `GET /live-classes`, `GET /live-classes/:id`, `POST /live-classes/:id/enroll`
- **User Content**: `GET /my-courses`, `GET /my-books`, `GET /my-live-classes`
- **Progress**: `GET /progress/:courseId`, `PUT /progress/:courseId`
- **Notifications**: `GET /notifications`, `PUT /notifications/:id/read`

### Admin API (`/api/v1/admin/`)
- **Dashboard**: `GET /dashboard`
- **Users**: `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`
- **Courses**: `GET /courses`, `POST /courses`, `PUT /courses/:id`, `DELETE /courses/:id`
- **Books**: `GET /books`, `POST /books`, `PUT /books/:id`, `DELETE /books/:id`
- **Live Classes**: `GET /live-classes`, `POST /live-classes`, `PUT /live-classes/:id`, `DELETE /live-classes/:id`
- **Analytics**: `GET /analytics/overview`, `GET /analytics/users`, `GET /analytics/courses`
- **Settings**: `GET /settings`, `PUT /settings`

### Shared API (`/api/v1/auth/`)
- **Authentication**: `POST /login`, `POST /register`, `POST /logout`
- **Token Management**: `POST /refresh-token`, `POST /forgot-password`, `POST /reset-password`
- **Profile**: `GET /me`, `PUT /me`, `PUT /me/password`
- **Preferences**: `GET /preferences`, `PUT /preferences`
- **Notifications**: `GET /notifications`, `PUT /notifications/:id/read`

## 🔐 Authentication & Authorization

### Role-Based Access Control
- **User Role**: Access to mobile APIs only
- **Admin Role**: Access to admin APIs only
- **Shared APIs**: Accessible by both roles

### Authentication Flow
1. User logs in via `/api/v1/auth/login`
2. Receives JWT token with role information
3. Token must be included in `Authorization: Bearer <token>` header
4. Middleware validates token and role for protected routes

## 🛠️ Setup & Development

### Prerequisites
- Node.js >= 18.0.0
- MySQL database
- Environment variables configured

### Installation
```bash
cd Backend
npm install
```

### Environment Variables
Create a `config.env` file with:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=your-db-host
DB_PORT=3306
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=your-database

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin-password
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📱 Frontend Integration

### Mobile App (React Native)
```javascript
// Base URL for mobile API
const API_BASE_URL = 'https://your-backend.vercel.app/api/v1/mobile';

// Example API call
const response = await fetch(`${API_BASE_URL}/courses`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Admin Panel
```javascript
// Base URL for admin API
const API_BASE_URL = 'https://your-backend.vercel.app/api/v1/admin';

// Example API call
const response = await fetch(`${API_BASE_URL}/dashboard`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Shared Auth
```javascript
// Base URL for auth API
const API_BASE_URL = 'https://your-backend.vercel.app/api/v1/auth';

// Example login
const response = await fetch(`${API_BASE_URL}/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
- `NODE_ENV=production`
- `PORT=5000`
- Database credentials
- JWT secrets
- Admin credentials

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Courses Table
```sql
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor VARCHAR(255),
  price DECIMAL(10, 2),
  duration VARCHAR(100),
  level VARCHAR(50),
  category VARCHAR(100),
  thumbnail VARCHAR(500),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Live Classes Table
```sql
CREATE TABLE live_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor VARCHAR(255),
  date DATETIME NOT NULL,
  duration INT,
  max_students INT,
  price DECIMAL(10, 2),
  status ENUM('upcoming', 'live', 'completed', 'cancelled') DEFAULT 'upcoming',
  meeting_link VARCHAR(500),
  thumbnail VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔧 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🛡️ Security Features

- **CORS**: Configured for multiple origins (mobile, admin, development)
- **Helmet**: Security headers
- **JWT Authentication**: Token-based authentication
- **Role-based Authorization**: User/Admin access control
- **Input Validation**: Request validation
- **Rate Limiting**: (Can be added)

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile

### Mobile Endpoints
- `GET /api/v1/mobile/courses` - Get all courses
- `GET /api/v1/mobile/courses/:id` - Get course by ID
- `POST /api/v1/mobile/courses/:id/enroll` - Enroll in course
- `GET /api/v1/mobile/books` - Get all books
- `GET /api/v1/mobile/books/:id` - Get book by ID
- `POST /api/v1/mobile/books/:id/purchase` - Purchase book
- `GET /api/v1/mobile/live-classes` - Get all live classes
- `GET /api/v1/mobile/live-classes/:id` - Get live class by ID
- `POST /api/v1/mobile/live-classes/:id/enroll` - Enroll in live class

### Admin Endpoints
- `GET /api/v1/admin/dashboard` - Get dashboard statistics
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/courses` - Get all courses
- `POST /api/v1/admin/courses` - Create new course
- `PUT /api/v1/admin/courses/:id` - Update course
- `DELETE /api/v1/admin/courses/:id` - Delete course
- `GET /api/v1/admin/books` - Get all books
- `POST /api/v1/admin/books` - Create new book
- `PUT /api/v1/admin/books/:id` - Update book
- `DELETE /api/v1/admin/books/:id` - Delete book

## 🚀 Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables**: Copy `config.env.example` to `config.env`
4. **Configure database**: Update database credentials in `config.env`
5. **Start development server**: `npm run dev`
6. **Test endpoints**: Use Postman or similar tool to test API endpoints

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

## 📄 License

This project is licensed under the MIT License.
