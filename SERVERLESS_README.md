# 🚀 Serverless Backend Setup

Your Mathematico backend is now configured for serverless deployment! No need to run servers manually.

## ⚡ Quick Start

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy Your Backend
```bash
# Deploy to production
npm run deploy:serverless

# Or use the batch file (Windows)
deploy.bat

# Or use the shell script (Linux/Mac)
./deploy.sh
```

## 🔧 Environment Setup

### Set Environment Variables in Vercel Dashboard:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add these variables:

```env
NODE_ENV=production
VERCEL=1
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-here-make-it-at-least-64-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-make-it-at-least-64-characters-long
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
ADMIN_EMAIL=admin@mathematico.com
ADMIN_PASSWORD=your-secure-admin-password
```

## 📊 Your API Endpoints

Once deployed, your API will be available at:
- **Health Check**: `https://your-domain.vercel.app/health`
- **API Root**: `https://your-domain.vercel.app/api/v1`
- **Documentation**: `https://your-domain.vercel.app/api-docs`

## 🛠️ Available Commands

```bash
# Deploy to production
npm run deploy:serverless

# Deploy preview
npm run deploy:preview

# View logs
npm run deploy:logs

# Setup environment variables
npm run setup:env

# Windows deployment
npm run deploy:windows

# Linux/Mac deployment
npm run deploy:linux
```

## 🔍 Monitoring

### View Logs
```bash
vercel logs
```

### Check Deployment Status
```bash
vercel ls
```

### Test Your API
```bash
# Health check
curl https://your-domain.vercel.app/health

# API root
curl https://your-domain.vercel.app/api/v1
```

## 🎯 Benefits

✅ **No Server Management** - No need to run servers manually  
✅ **Auto-Scaling** - Automatically scales with traffic  
✅ **Cost Effective** - Pay only for what you use  
✅ **Global CDN** - Fast response times worldwide  
✅ **Zero Downtime** - Automatic deployments  
✅ **Built-in Monitoring** - Logs and metrics included  

## 🚨 Troubleshooting

### Common Issues:
1. **Cold Start Timeout**: Increase `maxDuration` in vercel.json
2. **Memory Issues**: Increase memory allocation in vercel.json
3. **Database Connection**: Ensure MongoDB Atlas allows your IP
4. **CORS Errors**: Check CORS configuration in index.js

### Debug Commands:
```bash
# Test API locally
cd Backend && npm run test-api

# Check Vercel deployment status
vercel ls

# View detailed logs
vercel logs --follow
```

## 📱 Frontend Configuration

Update your frontend configuration to use the serverless API:

```typescript
// In Frontend-app/src/config.ts
export const API_CONFIG = {
  mobile: 'https://your-domain.vercel.app/api/v1/mobile',
  admin: 'https://your-domain.vercel.app/api/v1/admin',
  auth: 'https://your-domain.vercel.app/api/v1/auth',
};
```

## 🎉 You're All Set!

Your serverless backend is now ready! The API will automatically scale based on traffic and you won't need to manage any servers manually.

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).
