const ENABLE_SECURE_PDF = true;
const ENABLE_RAZORPAY = true;

const API_BASE_URL = "https://api.mathematico.in";

export default {
  expo: {
    name: 'Mathematico',
    slug: 'mathematico-app',
    version: '9.0.7',
    orientation: 'portrait',
    owner: 'adminmathematicodipanjan2026',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'a9079ffa-9c87-4f2e-b20b-f68dc870aed1'
      },
      enableSecurePdf: ENABLE_SECURE_PDF,
      enableRazorpay: ENABLE_RAZORPAY,
      EXPO_PUBLIC_API_BASE_URL: API_BASE_URL,
      API_URL: API_BASE_URL,
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV || 'production'
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 92,
      permissions: ['INTERNET'],
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      contentRating: {
        rating: 'Everyone',
        descriptors: ['Educational', 'Learning']
      }
    },
    plugins: ['expo-secure-store', 'expo-font', 'expo-image-picker', 'expo-document-picker']
  }
};
