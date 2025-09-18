# Mathematico - Mathematics Learning Platform

A comprehensive mathematics learning platform with web frontend, mobile app, and backend API.

## 🏗️ Project Structure

```
Mathematico/
├── Backend/                 # Express.js API Server
│   ├── api/                # Vercel serverless functions
│   ├── src/                # TypeScript source code
│   ├── uploads/            # File uploads
│   ├── api.js              # Main API entry point
│   └── vercel.json         # Vercel configuration
├── Frontend/               # React + Vite Web Application
│   ├── src/                # React components and pages
│   ├── public/             # Static assets
│   └── vercel.json         # Vercel configuration
├── mathematico/            # React Native Expo Mobile App
│   ├── src/                # Mobile app source code
│   ├── android/            # Android specific files
│   └── assets/             # Mobile app assets
├── Database.sql            # Database schema
├── DATABASE_SETUP_README.md # Database setup instructions
├── PROJECT_SETUP.md        # Project setup guide
└── vercel.json             # Root Vercel configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MySQL database
- Expo CLI (for mobile development)

### Backend Setup
```bash
cd Backend
npm install
cp config.env.example config.env
# Edit config.env with your database credentials
npm run dev
```

### Frontend Setup
```bash
cd Frontend
npm install
cp config.env.example config.env
# Edit config.env with your API URL
npm run dev
```

### Mobile App Setup
```bash
cd mathematico
npm install
expo start
```

## 🗄️ Database Setup

1. Create a MySQL database
2. Import the schema from `Database.sql`
3. Update database credentials in `Backend/config.env`
4. Run database migrations if needed

See `DATABASE_SETUP_README.md` for detailed instructions.

## 🌐 Deployment

### Backend (Vercel)
- Connected to Railway MySQL database
- API endpoints: `https://mathematico-backend-new.vercel.app/api/v1`

### Frontend (Vercel)
- Static build with Vite
- Connected to backend API

### Mobile App
- Expo managed workflow
- Can be built for iOS/Android

## 📱 Features

### Web Application
- User authentication
- Course browsing and enrollment
- Book library and purchases
- Live class scheduling
- Admin panel for content management

### Mobile Application
- Native iOS/Android app
- Same features as web app
- Optimized for mobile experience
- Admin panel support

### Backend API
- RESTful API with TypeScript
- JWT authentication
- File upload handling
- Database integration with TypeORM
- CORS configured for web and mobile

## 🛠️ Technology Stack

### Backend
- Node.js + Express
- TypeScript
- TypeORM + MySQL
- JWT authentication
- Vercel deployment

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components

### Mobile
- React Native
- Expo
- TypeScript
- Native navigation

## 📄 API Documentation

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh-token` - Refresh JWT token
- `GET /api/v1/auth/me` - Get current user

### Courses
- `GET /api/v1/courses` - List courses
- `GET /api/v1/courses/:id` - Get course details
- `POST /api/v1/courses/:id/enroll` - Enroll in course

### Books
- `GET /api/v1/books` - List books
- `GET /api/v1/books/:id` - Get book details
- `POST /api/v1/books/:id/purchase` - Purchase book

### Live Classes
- `GET /api/v1/live-classes` - List live classes
- `GET /api/v1/live-classes/:id` - Get class details
- `POST /api/v1/live-classes/:id/join` - Join live class

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd Backend
npm test

# Frontend tests
cd Frontend
npm test
```

### Code Quality
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please open an issue on GitHub.
