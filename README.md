# 🎓 Mathematico - Educational Platform

> **📱 Available on Google Play Store**  
> This app is already published and available on the Google Play Store. You can download and check it out!

A comprehensive educational platform featuring a mobile app and backend API for mathematics learning, built with React Native (Expo) and Node.js.

---

## 🚀 Project Overview

Mathematico is a full-stack learning platform that provides:
- **Mobile App** (React Native + Expo + TypeScript)
- **Backend API** (Node.js + Express + Vercel Serverless)
- **Admin Dashboard** (Integrated in mobile app)
- **Payment Integration** (Razorpay)

The platform allows students to browse courses, books, and live classes, while administrators can manage content through a dedicated admin interface.

---

## 🏗️ Architecture Overview

### How the App Works

1. **Entry Point**: `Frontend-app/App.tsx` - Initializes navigation, theme, and authentication
2. **Authentication**: `AuthContext` manages user state and authentication flow
3. **Navigation**: Two main navigators:
   - **Main Navigator**: For students (Home, Books, Courses, Live Classes, Profile)
   - **Admin Navigator**: For administrators (Dashboard, Books, Courses, Live Classes, Users, Payments, Settings)
4. **API Communication**: Service layer (`services/`) handles all backend API calls
5. **State Management**: React Context API for global state (AuthContext)

### Data Flow

```
User Action → Screen Component → Service Layer → Backend API → Response → Update State → UI Update
```

---

## 📁 Project Structure

### Frontend App (`Frontend-app/`)

```
Frontend-app/
├── App.tsx                    # Main app entry point, navigation setup
├── app.config.js             # Expo configuration
├── src/
│   ├── config.ts             # API configuration & environment setup
│   │                          # - Production: https://mathematico-backend-new.vercel.app
│   │                          # - Development: Uses EXPO_PUBLIC_API_BASE_URL env var
│   │                          #   (localhost only for internal testing)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx   # Global authentication state management
│   │                          # - User login/logout
│   │                          # - Token management
│   │                          # - Profile updates
│   │
│   ├── screens/              # Student-facing screens
│   │   ├── HomeScreen.tsx     # Dashboard with stats & featured content
│   │   ├── BooksScreen.tsx    # Browse and search books
│   │   ├── CoursesScreen.tsx  # Browse and search courses
│   │   ├── LiveClassesScreen.tsx  # Browse live classes
│   │   ├── ProfileScreen.tsx  # User profile & settings
│   │   ├── LoginScreen.tsx   # Authentication
│   │   ├── RegisterScreen.tsx # User registration
│   │   ├── BookDetailScreen.tsx    # Book details & purchase
│   │   ├── CourseDetailScreen.tsx  # Course details & enrollment
│   │   ├── LiveClassDetailScreen.tsx # Live class details
│   │   ├── CheckoutScreen.tsx      # Payment checkout
│   │   ├── SecurePdfScreen.tsx     # PDF viewer for books
│   │   ├── SettingsScreen.tsx      # App settings
│   │   └── AboutScreen.tsx         # About page
│   │
│   ├── admin/                # Admin-only screens
│   │   ├── AdminNavigator.tsx # Admin navigation setup
│   │   └── screens/
│   │       ├── AdminDashboard.tsx  # Admin dashboard with stats
│   │       ├── AdminBooks.tsx      # Manage books (CRUD)
│   │       ├── AdminCourses.tsx    # Manage courses (CRUD)
│   │       ├── AdminLiveClasses.tsx # Manage live classes (CRUD)
│   │       ├── AdminUsers.tsx      # User management
│   │       ├── AdminPayments.tsx   # Payment history
│   │       ├── AdminSettings.tsx   # Admin settings
│   │       ├── BookForm.tsx        # Create/Edit book form
│   │       ├── CourseForm.tsx       # Create/Edit course form
│   │       └── LiveClassForm.tsx   # Create/Edit live class form
│   │
│   ├── services/              # API service layer
│   │   ├── authService.ts    # Authentication API calls
│   │   ├── bookService.ts    # Books API (get, create, update, delete)
│   │   ├── courseService.ts  # Courses API (get, enroll, manage)
│   │   ├── liveClassService.ts # Live classes API
│   │   ├── adminService.ts   # Admin-specific API calls
│   │   ├── razorpayService.ts # Payment processing (Razorpay)
│   │   ├── pdfService.ts     # PDF handling
│   │   └── settingsService.ts # Settings API
│   │
│   ├── components/            # Reusable UI components
│   │   ├── Icon.tsx          # Icon component with mapping
│   │   ├── FallbackIcon.tsx  # Image fallback handling
│   │   ├── SecurePdfViewer.tsx # PDF viewer component
│   │   ├── UnifiedButton.tsx # Standardized button
│   │   ├── UnifiedCard.tsx   # Card component
│   │   ├── EmptyState.tsx    # Empty state display
│   │   └── ErrorBoundary.tsx # Error handling
│   │
│   ├── utils/                # Utility functions
│   │   ├── storage.ts        # Secure storage (AsyncStorage/SecureStore)
│   │   ├── errorHandler.ts    # Error handling utilities
│   │   ├── serviceErrorHandler.ts # Service-level error handling
│   │   ├── iconMapping.ts    # Icon name to component mapping
│   │   └── colorHelpers.ts   # Color utility functions
│   │
│   └── styles/               # Styling
│       ├── theme.ts          # App theme configuration
│       └── designSystem.ts   # Design system tokens
│
└── assets/                   # Images, fonts, icons
    ├── icon.png             # App icon
    ├── Owner.jpg            # Owner image (About screen)
    └── fonts/               # Custom fonts
```

### Backend (`Backend/`)

```
Backend/
├── index.js                 # Server entry point
├── routes/                  # API route definitions
│   ├── auth.js             # Authentication routes
│   ├── mobile.js           # Mobile app API routes
│   ├── admin.js            # Admin API routes
│   ├── student.js          # Student API routes
│   └── payment.js           # Payment routes
│
├── controllers/             # Route handlers
│   ├── authController.js   # Login, register, token refresh
│   ├── mobileController.js # Mobile app endpoints
│   ├── adminController.js  # Admin operations
│   ├── paymentController.js # Payment processing
│   └── studentController.js # Student operations
│
├── middlewares/            # Custom middleware
│   ├── auth.js             # JWT authentication middleware
│   └── upload.js           # File upload handling
│
├── models/                 # Data models (MongoDB schemas)
│   ├── User.js
│   ├── Book.js
│   ├── Course.js
│   └── LiveClass.js
│
├── utils/                  # Utility functions
│   ├── cloudinary.js       # Cloudinary integration
│   ├── jwt.js              # JWT token handling
│   └── fileUpload.js       # File upload utilities
│
└── config/                 # Configuration
    └── database.js          # Database connection
```

---

## 🔑 Key Components Explained

### 1. **Authentication Flow** (`src/contexts/AuthContext.tsx`)

- **Purpose**: Manages global authentication state
- **Key Functions**:
  - `login()`: Authenticates user and stores token
  - `logout()`: Clears user session
  - `checkAuthStatus()`: Validates stored token on app start
  - `refreshToken()`: Refreshes expired tokens
- **Storage**: Uses `SecureStore` for token storage (secure, encrypted)

### 2. **API Configuration** (`src/config.ts`)

- **Purpose**: Centralized API endpoint configuration
- **Key Features**:
  - Automatically switches between dev/prod URLs based on `__DEV__`
  - Production: `https://mathematico-backend-new.vercel.app`
  - Development: `http://localhost:5002`
- **Endpoints**:
  - `API_CONFIG.auth`: Authentication endpoints
  - `API_CONFIG.mobile`: Mobile app endpoints
  - `API_CONFIG.admin`: Admin endpoints

### 3. **Service Layer** (`src/services/`)

Each service handles API communication for a specific domain:

- **authService.ts**: Login, register, token management
- **bookService.ts**: Fetch books, create/update/delete (admin)
- **courseService.ts**: Fetch courses, enroll, manage (admin)
- **razorpayService.ts**: Payment order creation, verification
- **adminService.ts**: Admin dashboard stats, user management

**Pattern**: All services follow a consistent structure:
```typescript
async functionName(params): Promise<ApiResponse> {
  try {
    const response = await apiCall();
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 4. **Navigation Structure**

**Main App Navigation** (`App.tsx`):
- **Stack Navigator**: Handles screen transitions
- **Tab Navigator**: Bottom tabs for main sections
- **Conditional Rendering**: Shows Admin tab only for admin users

**Admin Navigation** (`src/admin/AdminNavigator.tsx`):
- Separate navigation stack for admin screens
- Tab-based navigation for admin sections
- Form screens (BookForm, CourseForm, LiveClassForm) as stack screens

### 5. **State Management**

- **Global State**: `AuthContext` for user authentication
- **Local State**: React hooks (`useState`, `useEffect`) in components
- **Storage**: `AsyncStorage` for non-sensitive data, `SecureStore` for tokens

### 6. **Error Handling**

- **Service Level**: `serviceErrorHandler.ts` - Logs errors and returns user-friendly messages
- **Component Level**: `ErrorBoundary.tsx` - Catches React errors
- **API Level**: Centralized error handling in services

---

## 🔄 How Features Work

### User Authentication

1. User enters credentials in `LoginScreen`
2. `AuthContext.login()` calls `authService.login()`
3. Service makes API call to `/api/v1/auth/login`
4. Backend validates and returns JWT token
5. Token stored in `SecureStore`
6. User state updated in `AuthContext`
7. Navigation redirects based on user role (admin/student)

### Browsing Books/Courses

1. Screen component (`BooksScreen`/`CoursesScreen`) loads
2. Calls service method (`bookService.getBooks()`)
3. Service makes API call with pagination/filters
4. Response data stored in component state
5. UI renders list with cards
6. Pull-to-refresh and infinite scroll supported

### Admin Content Management

1. Admin navigates to admin section (e.g., `AdminBooks`)
2. FAB button opens form (`BookForm`)
3. Admin fills form and uploads images/PDFs
4. Form submission calls `bookService.createBook()`
5. Service uploads files to Cloudinary, then creates book
6. Success response updates list
7. Admin can edit/delete items

### Payment Flow

1. User clicks "Purchase" on book/course
2. Navigates to `CheckoutScreen`
3. `razorpayService.createOrder()` creates payment order
4. Razorpay checkout opens
5. User completes payment
6. `razorpayService.verifyPayment()` verifies payment
7. Backend processes payment and grants access
8. User redirected to content

### PDF Viewing

1. User clicks "Read Book" on purchased book
2. Navigates to `SecurePdfScreen`
3. `pdfService.getSecurePdfUrl()` gets authenticated PDF URL
4. `SecurePdfViewer` component loads PDF
5. PDF is streamed (not downloadable) for security

---

## 🛠️ Technology Stack

### Frontend (Mobile App)
- **React Native** with **Expo** - Cross-platform mobile framework
- **TypeScript** - Type safety
- **React Navigation** - Navigation (Stack + Bottom Tabs)
- **React Native Paper** - UI component library
- **Axios** - HTTP client for API calls
- **AsyncStorage** - Local storage
- **Expo SecureStore** - Secure token storage
- **React Native Razorpay** - Payment integration
- **React Native PDF** - PDF viewing

### Backend
- **Node.js** with **Express.js** - Server framework
- **JWT** - Authentication tokens
- **Cloudinary** - Image and file storage
- **Vercel** - Serverless deployment
- **MongoDB** (if database is enabled)

---

## 🔒 Security Features

- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Secure Storage**: Tokens stored in encrypted SecureStore
- ✅ **HTTPS Only**: All production API calls use HTTPS
- ✅ **No Hardcoded Secrets**: Razorpay keys fetched from backend
- ✅ **Input Validation**: All user inputs validated
- ✅ **Error Handling**: Graceful error handling without exposing internals
- ✅ **PDF Security**: PDFs streamed, not downloadable

---

## 📊 API Endpoints Structure

### Authentication (`/api/v1/auth`)
- `POST /login` - User login
- `POST /register` - User registration
- `POST /logout` - User logout
- `POST /refresh-token` - Refresh access token
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Mobile App (`/api/v1/mobile`)
- `GET /books` - Get books list (paginated)
- `GET /books/:id` - Get book details
- `GET /courses` - Get courses list (paginated)
- `GET /courses/:id` - Get course details
- `POST /courses/:id/enroll` - Enroll in course
- `GET /live-classes` - Get live classes list
- `POST /payments/create-order` - Create Razorpay order
- `POST /payments/verify` - Verify payment

### Admin (`/api/v1/admin`)
- `GET /dashboard` - Dashboard statistics
- `GET /users` - Get users list
- `GET /books` - Get all books (admin)
- `POST /books` - Create book
- `PUT /books/:id` - Update book
- `DELETE /books/:id` - Delete book
- Similar endpoints for courses and live classes

---

## 🎨 UI/UX Design

- **Design System**: Centralized in `src/styles/designSystem.ts`
- **Theme**: Material Design inspired, configured in `src/styles/theme.ts`
- **Components**: Reusable components in `src/components/`
- **Icons**: Lucide React Native icons with custom mapping
- **Responsive**: Works on various screen sizes
- **Accessibility**: Proper labels and touch targets

---

## 📱 App Features

### For Students
- ✅ Browse books, courses, and live classes
- ✅ Search and filter content
- ✅ View detailed information
- ✅ Purchase books/courses via Razorpay
- ✅ Read purchased books (secure PDF viewer)
- ✅ Enroll in courses
- ✅ Profile management
- ✅ Settings customization

### For Administrators
- ✅ Admin dashboard with statistics
- ✅ Manage books (Create, Read, Update, Delete)
- ✅ Manage courses (Create, Read, Update, Delete)
- ✅ Manage live classes (Create, Read, Update, Delete)
- ✅ View users and payments
- ✅ Upload images and PDFs
- ✅ Admin settings

---

## 🔧 Configuration

### Environment Detection

The app uses environment variables for API configuration:
- **Production**: Uses `EXPO_PUBLIC_API_BASE_URL` environment variable (defaults to `https://mathematico-backend-new.vercel.app`)
- **Development/Internal Testing**: Can be configured via `EXPO_PUBLIC_API_BASE_URL` for Google Play Store internal testing
- **Note**: No localhost references in production code - all URLs are environment-driven

### API Configuration

All API endpoints are configured in `src/config.ts`:
```typescript
API_CONFIG = {
  auth: '.../api/v1/auth',
  mobile: '.../api/v1/mobile',
  admin: '.../api/v1/admin',
  // ...
}
```

### Currency Configuration

Indian Rupee (INR) is the default currency, configured in `src/config.ts`.

---

## 📄 Important Files to Understand

1. **`App.tsx`** - Start here to understand app initialization and navigation
2. **`src/contexts/AuthContext.tsx`** - Authentication logic and user state
3. **`src/config.ts`** - API configuration and environment setup
4. **`src/services/authService.ts`** - Example service implementation
5. **`src/screens/HomeScreen.tsx`** - Example screen implementation
6. **`src/admin/AdminNavigator.tsx`** - Admin navigation structure

---

## 🚀 Deployment

### Backend
- Deployed on **Vercel** as serverless functions
- Production URL: `https://mathematico-backend-new.vercel.app`
- Environment variables configured in Vercel dashboard

### Mobile App
- Built with **EAS Build** (Expo Application Services)
- Android: Published to Google Play Store
- Version: 7.0.0 (Build 7)
- Package: `com.anupam1505.mathematicoapp`

---

## 📝 Code Patterns

### Service Pattern
All services follow this pattern:
```typescript
class ServiceName {
  private async makeRequest(endpoint, options) {
    // Handles API calls with error handling
  }
  
  async getItems() {
    // Returns { data: [], meta: {} }
  }
}
```

### Screen Pattern
All screens follow this pattern:
```typescript
export default function ScreenName({ navigation }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    // Fetch and update state
  };
  
  return (
    // UI rendering
  );
}
```

---

## 🔍 Understanding the Code Flow

### When App Starts:
1. `App.tsx` loads
2. `AuthContext` checks for stored token
3. If token exists, validates with backend
4. Sets user state based on validation
5. Renders appropriate navigation (logged in/out)

### When User Logs In:
1. `LoginScreen` → `AuthContext.login()`
2. `authService.login()` → API call
3. Backend validates → Returns token + user data
4. Token stored → User state updated
5. Navigation redirects to Home/Admin

### When Admin Creates Book:
1. `AdminBooks` → FAB button → `BookForm`
2. Admin fills form → Uploads image/PDF
3. Form submits → `bookService.createBook()`
4. Service uploads files → Creates book via API
5. Success → Navigate back → List refreshes

---

## 📚 Additional Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **React Native Paper**: https://callstack.github.io/react-native-paper/
- **Razorpay Docs**: https://razorpay.com/docs/

---

## 🤝 Contributing

When contributing to this project:
1. Understand the service layer pattern
2. Follow existing code structure
3. Use TypeScript for type safety
4. Handle errors gracefully
5. Test on both development and production environments

---

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for mathematics education**

**Version**: 8.1.0 (Build 9)  
**Status**: ✅ Production Ready - Available on Google Play Store
