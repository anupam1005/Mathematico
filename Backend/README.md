# Mathematico Backend

Backend service for Mathematico - A Mathematics Learning Platform

[![Node.js CI](https://github.com/your-username/mathematico-backend/actions/workflows/node.js.yml/badge.svg)](https://github.com/your-username/mathematico-backend/actions/workflows/node.js.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm (v9 or higher) or yarn

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mathematico-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the database credentials and other environment variables as needed

4. **Database setup**
   ```bash
   # Create and seed the database
   npm run db:setup
   
   # Or run individual commands:
   # Create database
   npm run db:create
   
   # Seed the database
   npm run db:seed
   ```

   This will:
   - Create the database if it doesn't exist
   - Run all pending migrations
   - Seed the database with initial data (admin user, roles, settings, etc.)

   **Default Admin Credentials**
   - Email: admin@mathematico.com
   - Password: admin123

## Development

```bash
# Start development server with hot-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start


```

## Database Management

```bash
# Create database
npm run db:create

# Drop database
npm run db:drop

# Seed database
npm run db:seed

# Setup database (create and seed)
npm run db:setup
```

## Environment Variables

Copy `.env.example` to `.env` and update the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=mathematico
DB_SYNC=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## API Documentation

Once the server is running, you can access:
- API Documentation: `http://localhost:5000/api-docs` (or https://mathematico-backend-new.vercel.app/api-docs for production)
- Health Check: `http://localhost:5000/api/health` (or https://mathematico-backend-new.vercel.app/api/health for production)

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint -- --fix

# Format code with Prettier
npm run format
```

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/           # Database models
├── routes/           # Route definitions
├── services/         # Business logic
├── utils/            # Utility classes and functions
└── validations/      # Request validation schemas
```

## Environment Variables

See `.env.example` for all available environment variables.

## License

MIT
