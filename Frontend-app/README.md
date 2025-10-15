# Mathematico - Learn Mathematics

A comprehensive mathematics learning application built with React Native and Expo.

## Features

- **Live Classes**: Interactive live mathematics classes
- **Courses**: Structured learning paths for different math topics
- **Books**: Digital mathematics textbooks and resources
- **User Authentication**: Secure login and registration
- **Admin Panel**: Manage content and users
- **Modern UI**: Built with React Native Paper for a beautiful interface

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
mathematico/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── screens/        # App screens
│   ├── services/       # API services
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

## Migration from Bare React Native

This project was migrated from a bare React Native project to Expo for easier development and deployment. The migration included:

- ✅ Removed native Android/iOS folders
- ✅ Updated to Expo-compatible dependencies
- ✅ Configured vector icons for Expo
- ✅ Set up proper font loading
- ✅ Updated entry point for Expo

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
