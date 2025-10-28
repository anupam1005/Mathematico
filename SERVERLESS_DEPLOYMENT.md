# Mathematico Serverless Deployment Guide

## 🚀 Serverless Backend Setup

Your app is now configured for **serverless deployment**! This means when you publish to the Play Store, your backend will automatically work without manual server startup.

## 📋 Current Configuration

### ✅ What's Already Set Up:
- **Vercel Configuration**: `vercel.json` configured for serverless deployment
- **Environment Variables**: Production environment variables ready
- **API Endpoints**: Frontend automatically switches to production backend
- **Database**: MongoDB Atlas configured for cloud access

### 🔧 Backend URL Configuration:
- **Development**: Uses local backend (`http://10.148.37.132:5002`)
- **Production**: Uses serverless backend (`https://mathematico-backend-new.vercel.app`)

## 🚀 Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables
In your Vercel dashboard, add these environment variables:
- `JWT_SECRET` - Your JWT secret key
- `JWT_REFRESH_SECRET` - Your JWT refresh secret
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- `RAZORPAY_KEY_ID` - Your Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay key secret

### 4. Deploy Backend
```bash
# Run the deployment script
chmod +x deploy.sh
./deploy.sh

# Or deploy manually
vercel --prod
```

### 5. Test Deployment
Visit: `https://mathematico-backend-new.vercel.app/api/v1/mobile/health`

## 📱 App Configuration

### Development Mode (Local Testing):
- App uses local backend: `http://10.148.37.132:5002`
- You need to manually start backend server
- Perfect for development and testing

### Production Mode (Play Store):
- App automatically uses serverless backend: `https://mathematico-backend-new.vercel.app`
- No manual server startup required
- Backend scales automatically

## 🔄 How It Works

1. **Development**: Your app detects `__DEV__` mode and uses local backend
2. **Production**: Your app detects production mode and uses serverless backend
3. **Automatic**: No code changes needed when publishing to Play Store

## 🎯 Benefits

✅ **No Manual Server Management**  
✅ **Automatic Scaling**  
✅ **99.9% Uptime**  
✅ **Global CDN**  
✅ **Zero Maintenance**  

## 🚨 Important Notes

- **Environment Variables**: Make sure all sensitive keys are set in Vercel dashboard
- **Database**: MongoDB Atlas is already configured for cloud access
- **File Uploads**: Cloudinary handles file storage automatically
- **Payments**: Razorpay integration works seamlessly

## 🔧 Troubleshooting

### If deployment fails:
1. Check environment variables in Vercel dashboard
2. Ensure MongoDB connection string is correct
3. Verify all dependencies are in `package.json`

### If app can't connect:
1. Check if backend URL is correct in `config.ts`
2. Verify network connectivity
3. Check Vercel function logs

## 📞 Support

Your serverless backend will be available at:
`https://mathematico-backend-new.vercel.app`

Monitor your deployment at: [Vercel Dashboard](https://vercel.com/dashboard)
