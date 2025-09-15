# Database Setup and Course Section Fix Guide

## 🚀 Quick Start

This guide will help you set up the database and fix the Course Section issues in the Admin panel.

## 📋 Prerequisites

1. **MySQL Server** running on your machine
2. **Node.js** and **npm** installed
3. **Backend** and **Frontend** projects ready

## 🗄️ Database Setup

### Step 1: Configure Environment Variables

Make sure your `Backend/config.env` file has the correct database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=1234
DB_DATABASE=mathematico
```

### Step 2: Run Database Setup

Navigate to the Backend directory and run:

```bash
cd Backend
npm install
node setup-database.js
```

This script will:
- Create the `mathematico` database
- Create all required tables
- Create an admin user with credentials:
  - **Email**: `dc2006089@gmail.com`
  - **Password**: `Myname*321`

### Step 3: Verify Database Creation

You should see output like:
```
✅ Admin user verified:
ID: admin-user-001
Name: Admin User
Email: dc2006089@gmail.com
Is Admin: true
Role: admin

🎉 Admin user is ready! You can now login with:
Email: dc2006089@gmail.com
Password: Myname*321
```

## 🔧 Course Section Fixes Applied

### Backend Fixes

1. **Updated Database Schema**:
   - Fixed column naming conventions (snake_case)
   - Corrected JSON field names
   - Added proper foreign key constraints

2. **Updated Course Entity**:
   - Fixed column mappings for `what_you_will_learn`
   - Fixed column mappings for `who_is_this_for`
   - Fixed column mappings for `is_featured`
   - Fixed column mappings for `original_price`

3. **Enhanced Error Handling**:
   - Added authentication error handling
   - Added admin access validation
   - Improved error messages for debugging

### Frontend Fixes

1. **Updated Course Service**:
   - Added proper authentication error handling
   - Removed mock data fallbacks
   - Enhanced error logging

2. **Updated Admin Courses Page**:
   - Added authentication checks
   - Added admin role validation
   - Improved error handling and user feedback

3. **Updated Course Form**:
   - Added authentication validation
   - Added admin role checks
   - Enhanced error handling for form submission

## 🚀 Starting the Application

### Step 1: Start Backend Server

```bash
cd Backend
npm run dev
```

The server should start on `http://localhost:5000` (or visit https://mathematico-backend-new.vercel.app/ for production)

### Step 2: Start Frontend

```bash
cd Frontend
npm run dev
```

The frontend should start on `http://localhost:3000` (or visit https://mathematico-frontend.vercel.app/ for production)

## 🔐 Admin Login

1. Navigate to `http://localhost:3000/login` (or https://mathematico-frontend.vercel.app/login for production)
2. Use the admin credentials:
   - **Email**: `dc2006089@gmail.com`
   - **Password**: `Myname*321`
3. After login, navigate to `http://localhost:3000/admin/courses` (or https://mathematico-frontend.vercel.app/admin/courses for production)

## 🧪 Testing the Course Section

### Test Course Creation

1. Go to Admin → Courses
2. Click "Add Course"
3. Fill out the course form
4. Click "Save Course"

### Test Course Publishing

1. In the courses list, find a course
2. Click the actions menu (⋮)
3. Select "Publish" or "Unpublish"
4. Verify the status changes

### Test Course Editing

1. Click the actions menu (⋮) for any course
2. Select "Edit"
3. Modify course details
4. Click "Update Course"

## 🐛 Troubleshooting

### Common Issues

1. **"No token provided" Error**:
   - Make sure you're logged in as admin
   - Check browser console for authentication errors
   - Verify the backend server is running

2. **"Admin access required" Error**:
   - Ensure the user has `is_admin: true` in the database
   - Check the user's role is set to 'admin'

3. **Database Connection Issues**:
   - Verify MySQL server is running
   - Check database credentials in `config.env`
   - Ensure the `mathematico` database exists

4. **404 Errors on Course Actions**:
   - Verify the backend routes are properly configured
   - Check that the admin middleware is working
   - Ensure the user is authenticated and has admin role

### Debug Steps

1. **Check Backend Logs**:
   - Look for authentication errors
   - Check for database connection issues
   - Verify route matching

2. **Check Frontend Console**:
   - Look for API call errors
   - Check authentication state
   - Verify API endpoints

3. **Check Database**:
   - Verify admin user exists
   - Check user permissions
   - Verify table structure

## 📁 File Structure

```
Backend/
├── config.env                 # Database configuration
├── Database.sql              # Database schema (FIXED)
├── setup-database.js         # Database setup script (NEW)
├── src/
│   ├── entities/
│   │   ├── Course.ts         # Course entity (UPDATED)
│   │   ├── Book.ts           # Book entity
│   │   └── LiveClass.ts      # LiveClass entity
│   ├── controllers/
│   │   └── admin.controller.ts
│   └── routes/
│       └── admin.routes.ts

Frontend/
├── src/
│   ├── services/
│   │   └── course.service.ts # Course service (UPDATED)
│   ├── pages/admin/
│   │   ├── Courses.tsx       # Admin courses page (UPDATED)
│   │   └── CourseForm.tsx    # Course form (UPDATED)
│   └── contexts/
│       └── AuthContext.tsx   # Authentication context
```

## ✅ Success Indicators

When everything is working correctly, you should see:

1. ✅ Database created successfully
2. ✅ Admin user created with proper credentials
3. ✅ Backend server starts without errors
4. ✅ Frontend loads without console errors
5. ✅ Admin login works
6. ✅ Course creation works
7. ✅ Course publishing/unpublishing works
8. ✅ Course editing works
9. ✅ No 404 errors on admin actions

## 🆘 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Check the backend and frontend logs
4. Ensure the database setup completed successfully
5. Verify the admin user was created properly

## 🔄 Next Steps

After fixing the Course Section:

1. Test Book management functionality
2. Test Live Class management
3. Test User management
4. Test Module and Lesson management
5. Implement additional admin features as needed
