const ENABLE_SECURE_PDF = true;
const ENABLE_RAZORPAY = true;

export default {
  expo: {
    name: 'Mathematico',
    slug: 'mathematico-app',
    version: '8.4.9',
    jsEngine: 'hermes',
    orientation: 'portrait',
    owner: 'mathematicoadmin',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '2de3f800-25ce-42cc-a5df-83e21db7bc0c'
      },
      enableSecurePdf: ENABLE_SECURE_PDF,
      enableRazorpay: ENABLE_RAZORPAY,
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://mathematico-backend-new.vercel.app/api/v1',
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV || 'production'
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 35,
      usesCleartextTraffic: false,
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