# 🚀 Mathematico Platform Deployment Guide

## 📁 Project Structure
```
SirProject/
├── Backend/           # Node.js/Express backend
├── Frontend-app/      # React Native/Expo frontend
├── vercel.json        # Vercel deployment configuration
└── package.json       # Root package.json with scripts
```

## 🔧 Fixed Vercel Configuration

### ✅ What I Fixed:
1. **Removed conflicting `maxLambdaSize`** - Not supported in current Vercel
2. **Removed hardcoded environment variables** - Should be set in Vercel dashboard
3. **Simplified configuration** - Clean, working setup
4. **Optimized for serverless** - Proper function configuration

### 📋 Current `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "Backend/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/Backend/index.js" }
  ],
  "functions": {
    "Backend/index.js": {
      "runtime": "@vercel/node",
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

## 🚀 Deployment Steps

### 1. Commit Changes to Git
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### 2. Deploy to Vercel
```bash
# Option 1: Using npm script
npm run deploy

# Option 2: Direct Vercel command
vercel --prod --confirm

# Option 3: Using the deployment script
./deploy.sh
```

### 3. Set Environment Variables in Vercel Dashboard
Required variables:
- `MONGODB_URI` - Your MongoDB connection string
- `MONGODB_DB` - Database name (default: mathematico)
- `JWT_SECRET` - JWT secret key (min 64 characters)
- `JWT_REFRESH_SECRET` - Refresh token secret (min 64 characters)

Optional variables:
- `CLOUDINARY_CLOUD_NAME` - For file uploads
- `CLOUDINARY_API_KEY` - For file uploads
- `CLOUDINARY_API_SECRET` - For file uploads
- `ADMIN_EMAIL` - Admin email (default: admin@mathematico.com)
- `ADMIN_PASSWORD` - Admin password (default: AdminPass@2024)

### 4. Create Admin User
After deployment, create an admin user:
```bash
curl -X POST https://your-vercel-url.vercel.app/api/v1/auth/create-admin
```

### 5. Test Deployment
```bash
# Test health endpoint
curl https://your-vercel-url.vercel.app/api/v1/auth/health

# Test admin login
curl -X POST https://your-vercel-url.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mathematico.com","password":"AdminPass@2024"}'
```

## 🔧 Local Development

### Start Backend
```bash
npm run dev:backend
# or
cd Backend && npm run dev
```

### Start Frontend
```bash
npm run dev:mobile
# or
cd Frontend-app && npm run dev
```

## 📱 Frontend Configuration

The frontend automatically detects the environment:
- **Development**: Uses `http://localhost:5001`
- **Production**: Uses your Vercel deployment URL

Update `Frontend-app/src/config.ts` if needed.

## 🛠️ Troubleshooting

### Common Issues

1. **401 Unauthorized**: Admin user doesn't exist
   - Solution: Create admin user with `/api/v1/auth/create-admin`

2. **Database Connection**: MongoDB connection issues
   - Solution: Check `MONGODB_URI` in Vercel environment variables

3. **JWT Errors**: Token verification issues
   - Solution: Check `JWT_SECRET` and `JWT_REFRESH_SECRET` in Vercel

4. **CORS Issues**: Frontend can't connect to backend
   - Solution: Check CORS configuration in `Backend/index.js`

### Debug Commands

```bash
# Check backend logs
vercel logs

# Test specific endpoint
curl -X GET https://your-vercel-url.vercel.app/api/v1/auth/health

# Check environment variables
vercel env ls
```

## 🔒 Security Notes

1. **Never commit** environment variables to git
2. **Use strong passwords** for admin accounts
3. **Rotate JWT secrets** regularly
4. **Monitor access logs** for suspicious activity
5. **Keep dependencies updated** for security patches

## 📞 Support

If you encounter issues:
1. Check the logs in Vercel dashboard
2. Test locally first with `npm run dev:backend`
3. Verify environment variables are set correctly
4. Check MongoDB connection and database access
