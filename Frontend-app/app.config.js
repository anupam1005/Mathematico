const ENABLE_SECURE_PDF = true;
const ENABLE_RAZORPAY = true;

// IMPORTANT:
// - In Expo, `process.env.EXPO_PUBLIC_*` is the supported mechanism for runtime config.
// - We intentionally DO NOT silently fall back to the old API domain.
// - If the env var is missing, the app will fail fast with an actionable error in `src/config.ts`.
const EXPO_PUBLIC_API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    typeof process.env.EXPO_PUBLIC_API_BASE_URL === 'string' &&
    process.env.EXPO_PUBLIC_API_BASE_URL.trim().length > 0
    ? process.env.EXPO_PUBLIC_API_BASE_URL.trim()
    : undefined);

export default {
  expo: {
    name: 'Mathematico',
    slug: 'mathematico-app',
    version: '9.0.2',
    // Hermes is required for react-native-reanimated / worklets native builds on RN 0.81+ (JSC + worklets breaks link step).
    orientation: 'portrait',
    owner: 'adminmathematicoofficial',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'e357abd1-860b-44c0-9015-47e2e4f0b02f'
      },
      enableSecurePdf: ENABLE_SECURE_PDF,
      enableRazorpay: ENABLE_RAZORPAY,
      EXPO_PUBLIC_API_BASE_URL,
      API_URL: EXPO_PUBLIC_API_BASE_URL,
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV || 'production'
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 87,
      permissions: ['INTERNET'],
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
    plugins: ['expo-secure-store', 'expo-font']
  }
};
