# Mathematico App - Comprehensive Testing Checklist

## 🎯 Pre-APK Build Testing Checklist

### ✅ **System Requirements**
- [ ] Node.js installed and working
- [ ] npm/yarn package manager working
- [ ] React Native CLI installed
- [ ] Android SDK installed
- [ ] Java Development Kit (JDK) installed
- [ ] Gradle build system working

### ✅ **Project Structure**
- [ ] Backend directory exists with all files
- [ ] Frontend-app directory exists with all files
- [ ] vercel.json configuration file present
- [ ] package.json files in both directories
- [ ] All required dependencies installed

### ✅ **Backend Testing**

#### **Health & System Endpoints**
- [ ] `/health` - Returns system status
- [ ] `/` - Returns API information
- [ ] `/api/v1` - Returns API root information

#### **Authentication Endpoints**
- [ ] `POST /api/v1/auth/login` - Admin login works
- [ ] `POST /api/v1/auth/login` - Student login works
- [ ] `POST /api/v1/auth/register` - Student registration works
- [ ] `POST /api/v1/auth/logout` - Logout works
- [ ] `GET /api/v1/auth/profile` - Profile retrieval works
- [ ] `POST /api/v1/auth/refresh-token` - Token refresh works
- [ ] `GET /api/v1/auth/health` - Auth health check works

#### **Admin Endpoints**
- [ ] `GET /api/v1/admin/dashboard` - Dashboard data loads
- [ ] `GET /api/v1/admin/users` - Users list loads
- [ ] `GET /api/v1/admin/books` - Books list loads
- [ ] `GET /api/v1/admin/courses` - Courses list loads
- [ ] `GET /api/v1/admin/live-classes` - Live classes list loads
- [ ] `GET /api/v1/admin/payments` - Payments list loads
- [ ] `GET /api/v1/admin/settings` - Settings load
- [ ] `GET /api/v1/admin/info` - Admin info loads

#### **Mobile Endpoints**
- [ ] `GET /api/v1/mobile/books` - Mobile books list loads
- [ ] `GET /api/v1/mobile/courses` - Mobile courses list loads
- [ ] `GET /api/v1/mobile/live-classes` - Mobile live classes load
- [ ] `GET /api/v1/mobile/settings` - Mobile settings load
- [ ] `GET /api/v1/mobile/health` - Mobile health check works

#### **Payment Endpoints**
- [ ] `GET /api/v1/payments/config` - Payment config loads
- [ ] `POST /api/v1/payments/create-order` - Order creation works
- [ ] `POST /api/v1/payments/verify` - Payment verification works
- [ ] `GET /api/v1/payments/history` - Payment history loads

### ✅ **Frontend Testing**

#### **Authentication Screens**
- [ ] LoginScreen renders correctly
- [ ] LoginScreen handles admin credentials
- [ ] LoginScreen handles student credentials
- [ ] LoginScreen shows validation errors
- [ ] RegisterScreen renders correctly
- [ ] RegisterScreen handles form submission
- [ ] RegisterScreen shows validation errors

#### **Admin Screens**
- [ ] AdminDashboard loads and displays data
- [ ] AdminBooks loads and displays books list
- [ ] AdminCourses loads and displays courses list
- [ ] AdminLiveClasses loads and displays live classes
- [ ] AdminUsers loads and displays users list
- [ ] AdminPayments loads and displays payments
- [ ] AdminSettings loads and handles updates

#### **Student Screens**
- [ ] HomeScreen loads and displays content
- [ ] CoursesScreen loads and displays courses
- [ ] BooksScreen loads and displays books
- [ ] LiveClassesScreen loads and displays live classes
- [ ] ProfileScreen loads and displays user info
- [ ] SettingsScreen loads and handles updates

#### **Shared Components**
- [ ] UnifiedButton renders and handles clicks
- [ ] UnifiedCard renders with content
- [ ] CustomTextInput handles input
- [ ] EmptyState displays correctly
- [ ] Icon renders with correct name/size
- [ ] ErrorBoundary catches errors
- [ ] NetworkStatus shows connection status

### ✅ **Database Testing**
- [ ] MongoDB connection works
- [ ] User model operations work
- [ ] Course model operations work
- [ ] Book model operations work
- [ ] LiveClass model operations work
- [ ] Payment model operations work

### ✅ **File Upload Testing**
- [ ] Image uploads work (Cloudinary)
- [ ] PDF uploads work (Cloudinary)
- [ ] File validation works
- [ ] File size limits enforced

### ✅ **Security Testing**
- [ ] JWT tokens work correctly
- [ ] Password hashing works
- [ ] CORS configuration correct
- [ ] Rate limiting works
- [ ] Input validation works

### ✅ **Performance Testing**
- [ ] API response times acceptable
- [ ] Frontend renders quickly
- [ ] Images load efficiently
- [ ] No memory leaks detected

### ✅ **Error Handling**
- [ ] Network errors handled gracefully
- [ ] API errors displayed to user
- [ ] Validation errors shown
- [ ] Fallback states work

### ✅ **Build Testing**
- [ ] TypeScript compilation succeeds
- [ ] React Native bundle builds
- [ ] Android build succeeds
- [ ] No build warnings/errors

## 🚀 **Testing Commands**

### **Run API Tests**
```bash
# Run comprehensive API testing
node comprehensive-api-test.js

# Or run the test script
./run-comprehensive-tests.sh  # Linux/Mac
run-comprehensive-tests.bat   # Windows
```

### **Run Frontend Tests**
```bash
cd Frontend-app
npm test
```

### **Test Backend Locally**
```bash
cd Backend
npm start
# Test endpoints manually or with curl
```

### **Test Android Build**
```bash
cd Frontend-app/android
./gradlew assembleDebug
```

## 📊 **Success Criteria**

- **API Tests**: 80%+ endpoints working
- **Frontend Tests**: 80%+ components working
- **Build Tests**: All builds successful
- **Security Tests**: All security measures working
- **Performance**: Response times < 3 seconds

## 🎯 **Final Checklist**

- [ ] All critical endpoints working
- [ ] Authentication flow complete
- [ ] Admin functionality working
- [ ] Student functionality working
- [ ] Payment integration working
- [ ] File uploads working
- [ ] Error handling robust
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Build process successful

**If all items are checked ✅, the app is ready for APK build!**
