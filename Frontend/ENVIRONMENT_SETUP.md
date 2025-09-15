# 🌍 Environment Configuration Guide

This guide explains how to properly configure environment variables for the Mathematico frontend application.

## 📁 Environment Files

### 1. `config.env.example`
- **Purpose**: Template file for development setup
- **Usage**: Copy to `config.env` and modify as needed
- **Environment**: Development/Local

### 2. `config.env`
- **Purpose**: Active development configuration
- **Usage**: Used by Vite during development
- **Environment**: Development/Local

### 3. `config.env.production`
- **Purpose**: Production configuration template
- **Usage**: Used during production builds
- **Environment**: Production/Vercel

## 🔧 Configuration Variables

### API Configuration
```env
# Base API URL for all requests
VITE_API_URL=http://localhost:5000/api/v1  # Development
VITE_API_URL=https://mathematico-backend-new.vercel.app/api/v1  # Production

# Request timeout in milliseconds
VITE_API_TIMEOUT=10000  # Development (10s)
VITE_API_TIMEOUT=15000  # Production (15s)
```

### Token Configuration
```env
# Token refresh interval in milliseconds (14 minutes)
VITE_TOKEN_REFRESH_INTERVAL=840000
```

### App Configuration
```env
# Application name
VITE_APP_NAME=Mathematico

# Application version
VITE_APP_VERSION=1.0.0
```

### Feature Flags
```env
# Enable/disable analytics
VITE_ENABLE_ANALYTICS=false  # Development
VITE_ENABLE_ANALYTICS=true   # Production

# Enable/disable debug mode
VITE_ENABLE_DEBUG_MODE=true   # Development
VITE_ENABLE_DEBUG_MODE=false  # Production
```

### Backend Configuration
```env
# Backend base URL (without /api/v1)
VITE_BACKEND_URL=http://localhost:5000  # Development
VITE_BACKEND_URL=https://mathematico-backend-new.vercel.app  # Production

# Health check endpoint
VITE_BACKEND_HEALTH_CHECK=/api/v1/health
```

### Frontend Configuration
```env
# Frontend URL
VITE_FRONTEND_URL=http://localhost:5173  # Development
VITE_FRONTEND_URL=https://mathematico-frontend.vercel.app  # Production

# Frontend port
VITE_FRONTEND_PORT=5173  # Development
VITE_FRONTEND_PORT=443   # Production (HTTPS)
```

### Build Configuration
```env
# Build mode
VITE_BUILD_MODE=development  # Development
VITE_BUILD_MODE=production   # Production
```

### Security Configuration
```env
# Enable HTTPS
VITE_ENABLE_HTTPS=false  # Development
VITE_ENABLE_HTTPS=true   # Production

# Enable CORS
VITE_ENABLE_CORS=true
```

## 🚀 Setup Instructions

### Development Setup
1. Copy the example file:
   ```bash
   cp config.env.example config.env
   ```

2. Modify `config.env` with your local settings:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   VITE_BACKEND_URL=http://localhost:5000
   VITE_FRONTEND_URL=http://localhost:5173
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Production Setup
1. Ensure `config.env.production` is configured correctly
2. Build the application:
   ```bash
   npm run build
   ```

3. Deploy to Vercel (automatically uses production config)

## 🔍 Environment Variable Usage

### In Code
```typescript
// Access environment variables
const apiUrl = import.meta.env.VITE_API_URL;
const backendUrl = import.meta.env.VITE_BACKEND_URL;
const isDebug = import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true';
```

### In Vite Config
```typescript
// vite.config.ts
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL),
  }
});
```

## ⚠️ Important Notes

1. **VITE_ Prefix**: All environment variables must start with `VITE_` to be accessible in the frontend
2. **Build Time**: Environment variables are embedded at build time, not runtime
3. **Security**: Never put sensitive data in frontend environment variables
4. **Case Sensitivity**: Environment variable names are case-sensitive
5. **String Values**: All values are treated as strings, use `=== 'true'` for booleans

## 🐛 Troubleshooting

### Common Issues

1. **Variable Not Found**:
   - Ensure the variable starts with `VITE_`
   - Check spelling and case
   - Restart the development server

2. **Wrong URL**:
   - Verify the backend is running
   - Check CORS configuration
   - Ensure the URL is accessible

3. **Build Errors**:
   - Check for syntax errors in environment files
   - Ensure all required variables are set
   - Verify the production configuration

### Debug Commands
```bash
# Check environment variables
npm run dev -- --debug

# Build with verbose output
npm run build -- --debug

# Check Vite configuration
npx vite --config vite.config.ts --debug
```

## 📋 Environment Checklist

### Development
- [ ] `config.env` exists and is configured
- [ ] Backend URL points to localhost:5000
- [ ] Frontend URL points to localhost:5173
- [ ] Debug mode is enabled
- [ ] Analytics is disabled

### Production
- [ ] `config.env.production` is configured
- [ ] Backend URL points to Vercel backend
- [ ] Frontend URL points to Vercel frontend
- [ ] Debug mode is disabled
- [ ] Analytics is enabled
- [ ] HTTPS is enabled
- [ ] Timeout is increased for production

## 🔄 Migration Guide

### From Old Configuration
If you're migrating from an older configuration:

1. **Update URLs**: Change any hardcoded URLs to use environment variables
2. **Add Missing Variables**: Ensure all required variables are present
3. **Test Both Environments**: Verify both development and production work
4. **Update Documentation**: Update any documentation with new variable names

---

**Need Help?** Check the troubleshooting section or refer to the main project documentation.
