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
    // Must match native `hermesEnabled=false` + JSC in Gradle (Hermes disabled for production stability).
    jsEngine: 'jsc',
    orientation: 'portrait',
    owner: 'mathematico232',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'e0cd2373-4003-4661-ab5c-3b202f8e6754'
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
      jsEngine: 'jsc',
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
