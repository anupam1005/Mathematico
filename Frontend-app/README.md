# Mathematico - Learn Mathematics

A mathematics learning application built with React Native and Expo.

**⚠️ IMPORTANT: Database functionality has been removed from this project. Only admin authentication is available.**

## Features

- **🔐 Admin Authentication**: Secure admin login
- **📱 Modern UI**: Built with React Native Paper for a beautiful interface
- **🎨 Responsive Design**: Optimized for mobile devices
- **🔧 TypeScript**: Type-safe development
- **📊 Empty State Handling**: Graceful handling of no data scenarios

**❌ Disabled Features:**
- User registration
- Course management
- Book management
- Live class management
- Payment processing
- Data persistence

## Getting Started

### Prerequisites

- Node.js (>= 16)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your preferred platform:
   ```bash
   npm run android  # Android
   npm run ios      # iOS (macOS only)
   npm run web      # Web browser
   ```

## Project Structure

```
Frontend-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── screens/        # App screens
│   ├── services/       # API services (simplified)
│   ├── styles/         # Theme and styling
│   └── types/          # TypeScript type definitions
├── assets/             # Images, fonts, and other assets
├── App.tsx            # Main app component
└── index.ts           # App entry point
```

## Technologies Used

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation library
- **React Native Paper**: Material Design components
- **Vector Icons**: Icon library
- **AsyncStorage**: Local data storage

## API Integration

The app connects to the Mathematico backend API:

- **Base URL**: Configured in `src/config.ts`
- **Authentication**: JWT-based admin authentication
- **Services**: All services return empty data (database disabled)

### Available Services

- `authService`: Admin authentication only
- `bookService`: Returns empty arrays
- `courseService`: Returns empty arrays
- `liveClassService`: Returns empty arrays
- `adminService`: Basic admin operations
- `mobileService`: Returns empty data

## Development

### Available Scripts

- `npm start`: Start the Expo development server
- `npm run android`: Run on Android device/emulator
- `npm run ios`: Run on iOS device/simulator
- `npm run web`: Run in web browser

### Building for Production

For production builds, use Expo's build service:

```bash
npx expo build:android  # Android APK/AAB
npx expo build:ios      # iOS IPA
```

## Configuration

### Backend Configuration

Update `src/config.ts` to point to your backend:

```typescript
const PROD_BACKEND = 'https://your-backend-domain.vercel.app';
```

### Environment Variables

The app uses the backend's environment variables for authentication. No local environment variables are required.

## Current State

### ✅ Working Features
- Admin login/logout
- Navigation between screens
- Empty state displays
- Error handling
- Modern UI components

### ❌ Disabled Features
- User registration
- Course enrollment
- Book downloads
- Live class participation
- Payment processing
- User profiles
- Data persistence

## Migration Notes

If you need to restore database functionality:

1. **Backend**: Restore MongoDB connection and models
2. **Services**: Update services to use real API data
3. **Screens**: Update screens to handle real data
4. **Authentication**: Enable user registration
5. **Features**: Re-enable course/book/live class features

## Testing

### Test Admin Login
1. Open the app
2. Navigate to Login screen
3. Use admin credentials from backend
4. Verify successful authentication

### Test Empty States
1. Navigate to Books/Courses/Live Classes screens
2. Verify empty state messages display
3. Check that no data is shown

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the backend documentation
- Review the API endpoints

---

**Note: This is a simplified version without database functionality. Only admin authentication is available.**