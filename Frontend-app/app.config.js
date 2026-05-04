const ENABLE_SECURE_PDF = true;
const ENABLE_RAZORPAY = true;

const API_BASE_URL = "https://api.mathematico.in";

export default {
  expo: {
    name: 'Mathematico',
    slug: 'mathematico-app',
    version: '9.0.4',
    orientation: 'portrait',
    owner: 'adminmathematico2026',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '7bbf204a-18c0-4a04-841b-64437d52246f'
      },
      enableSecurePdf: ENABLE_SECURE_PDF,
      enableRazorpay: ENABLE_RAZORPAY,
      EXPO_PUBLIC_API_BASE_URL: API_BASE_URL,
      API_URL: API_BASE_URL,
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV || 'production'
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 89,
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
