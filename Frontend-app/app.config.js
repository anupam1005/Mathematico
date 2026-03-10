const ENABLE_SECURE_PDF = true;
const ENABLE_RAZORPAY = true;

export default {
  expo: {
    name: 'Mathematico',
    slug: 'mathematico-app',
    version: '8.6.0',
    // Force Hermes everywhere (Expo + native Android/iOS) for consistent runtime behavior.
    jsEngine: 'hermes',
    orientation: 'portrait',
    owner: 'adminmathematico',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'f8e2c0a8-b8b2-4eee-8a66-39f77f03700b'
      },
      enableSecurePdf: ENABLE_SECURE_PDF,
      enableRazorpay: ENABLE_RAZORPAY,
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://mathematico-backend-new.vercel.app',
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV || 'production'
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 46,
      usesCleartextTraffic: false,
      // Explicitly set JS engine for Android as well (for EAS build compatibility)
      jsEngine: 'hermes',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      contentRating: {
        rating: 'Everyone',
        descriptors: ['Educational', 'Learning']
      }
    },
    plugins: [
      'expo-secure-store',
      'expo-font',
      ...(ENABLE_RAZORPAY ? ['./plugins/withRazorpay.js'] : [])
    ]
  }
};