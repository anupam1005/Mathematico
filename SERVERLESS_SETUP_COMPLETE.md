# Mathematico Serverless Deployment Guide

## 🚀 Fixed Vercel Configuration

Your `vercel.json` has been optimized for serverless deployment:

### ✅ **Fixed Issues:**
1. **Routes Configuration**: Properly handles all API endpoints
2. **Environment Variables**: Removed problematic `@` syntax
3. **Build Configuration**: Simplified and optimized
4. **Health Check**: Explicit route for `/health` endpoint

### 📋 **Current Routes:**
- `/api/*` → All API endpoints
- `/health` → Health check endpoint  
- `/` → Root endpoint
- `/*` → Catch-all for other requests

## 🔧 **Environment Variables Setup**

### **Required Environment Variables in Vercel Dashboard:**

1. **JWT Configuration:**
   ```
   JWT_SECRET=your_jwt_secret_key_here_minimum_64_characters
   JWT_REFRESH_SECRET=your_refresh_secret_key_here_minimum_64_characters
   ```

2. **Cloudinary Configuration:**
   ```
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

3. **Razorpay Configuration:**
   ```
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

4. **Optional Configuration:**
   ```
   ADMIN_PASSWORD=your_admin_password_minimum_8_characters
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   ```

## 🚀 **Deployment Steps**

### **Step 1: Set Environment Variables**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `mathematico-backend`
3. Go to **Settings** → **Environment Variables**
4. Add all required variables listed above

### **Step 2: Deploy**
```bash
# Navigate to project root
cd C:\SirProject

# Deploy to production
vercel --prod
```

### **Step 3: Test Deployment**
```bash
# Test health endpoint
curl https://mathematico-backend-new.vercel.app/health

# Test API root
curl https://mathematico-backend-new.vercel.app/api/v1

# Test auth endpoint
curl https://mathematico-backend-new.vercel.app/api/v1/auth
```

## 📱 **App Configuration**

### **Development Mode:**
- Backend: `http://10.148.37.132:5002`
- Manual server startup required
- Perfect for testing

### **Production Mode:**
- Backend: `https://mathematico-backend-new.vercel.app`
- Automatic serverless operation
- No manual startup needed

## 🎯 **How It Works**

1. **Local Development**: App uses local backend
2. **Play Store Release**: App automatically uses serverless backend
3. **Zero Configuration**: No code changes needed

## 🔍 **Troubleshooting**

### **If deployment fails:**
1. Check environment variables in Vercel dashboard
2. Ensure MongoDB connection string is correct
3. Verify all dependencies are in `package.json`

### **If app can't connect:**
1. Check backend URL in `config.ts`
2. Verify network connectivity
3. Check Vercel function logs

## 📊 **Monitoring**

- **Vercel Dashboard**: Monitor function performance
- **Health Check**: `https://mathematico-backend-new.vercel.app/health`
- **API Status**: `https://mathematico-backend-new.vercel.app/api/v1`

## 🎉 **Benefits**

✅ **Zero Maintenance** - No server management  
✅ **Automatic Scaling** - Handles traffic spikes  
✅ **99.9% Uptime** - Reliable service  
✅ **Global CDN** - Fast worldwide access  
✅ **Cost Effective** - Pay only for usage  

Your backend is now ready for serverless deployment! 🚀
