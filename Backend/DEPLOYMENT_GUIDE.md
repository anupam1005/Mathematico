# 🚀 Complete Deployment Guide

## Step 1: Set Environment Variables in Vercel

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

### Required Variables:
```
MONGODB_URI=mongodb+srv://anupamdas0515_db_user:8bO4aEEQ2TYAfCSu@mathematico-app.vszbcc9.mongodb.net/?retryWrites=true&w=majority&appName=Mathematico-app
ADMIN_EMAIL=dc2006089@gmail.com
ADMIN_PASSWORD=Myname*321
JWT_SECRET=ea8d2dd209821c788f00430dbada14059f8729cdb9787927fc66d4b614ce934d8a605ca223405bddd2b4c984ed8490c7c62550d579f1b245754ee2f0c6e6fe33
JWT_REFRESH_SECRET=4f5093c4703da4e343a60514af3d606f885386828349a58d2cec5c6d66bb829b373361b340518abc1011e697cecd71dfcad0a32cc4a1e05a167e11076877f090
CLOUDINARY_CLOUD_NAME=duxjf7v40
CLOUDINARY_API_KEY=691967822927518
CLOUDINARY_API_SECRET=M5LspD_XGt5DtI_0XPQ5DKz3awA
BACKEND_URL=https://mathematico-backend-new.vercel.app
VERCEL=1
NODE_ENV=production
```

## Step 2: Deploy to Vercel

```bash
# Deploy the updated backend
vercel --prod

# Or if using Git integration, just push to main branch
git add .
git commit -m "Fix MongoDB connection and remove fallbacks"
git push origin main
```

## Step 3: Seed the Database

```bash
# Run the seed script to populate with test data
node Backend/seedData.js
```

## Step 4: Test All Endpoints

```bash
# Run comprehensive tests
node Backend/test-all-endpoints.js

# Or test specific functionality
node Backend/test-admin.js
```

## Step 5: Verify Mobile App Connection

1. Update your mobile app's config to use the production backend
2. Test login with admin credentials: `dc2006089@gmail.com` / `Myname*321`
3. Test creating books, courses, and live classes
4. Test viewing content as a student

## Expected Results:

✅ **Admin Dashboard**: Shows statistics and data
✅ **Books**: Can create, view, edit, delete books
✅ **Courses**: Can create, view, edit, delete courses  
✅ **Live Classes**: Can create, view, edit, delete live classes
✅ **Mobile App**: Can view all content and enroll in courses
✅ **File Uploads**: Can upload PDFs and images
✅ **Authentication**: Login/logout works properly

## Troubleshooting:

### If you get 503 errors:
1. Check Vercel logs: `vercel logs`
2. Verify environment variables are set
3. Test MongoDB connection: `node -e "require('./utils/database').connectToDatabase()"`

### If database connection fails:
1. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Vercel)
2. Verify MONGODB_URI is correct
3. Check network connectivity

### If admin routes don't work:
1. Check authentication token
2. Verify admin credentials
3. Test with: `curl -H "Authorization: Bearer TOKEN" https://your-backend.vercel.app/api/v1/admin/books`

## Success Indicators:

- ✅ No more 503 "Service Unavailable" errors
- ✅ Admin can create books, courses, live classes
- ✅ Students can view and enroll in content
- ✅ File uploads work properly
- ✅ Mobile app connects successfully
- ✅ All buttons and functions work as expected

## Final Checklist:

- [ ] Environment variables set in Vercel
- [ ] Backend deployed successfully
- [ ] Database seeded with test data
- [ ] Admin login works
- [ ] Can create content (books, courses, live classes)
- [ ] Mobile app connects to backend
- [ ] Students can view content
- [ ] File uploads work
- [ ] All endpoints return 200 status codes
