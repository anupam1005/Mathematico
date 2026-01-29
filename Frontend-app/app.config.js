const IS_DEV = process.env.APP_VARIANT === 'development';

// Feature flags (enabled by default for production)
if (!process.env.EXPO_PUBLIC_ENABLE_SECURE_PDF) {
  process.env.EXPO_PUBLIC_ENABLE_SECURE_PDF = 'true';
}
if (!process.env.EXPO_PUBLIC_ENABLE_RAZORPAY) {
  process.env.EXPO_PUBLIC_ENABLE_RAZORPAY = 'true';
}

const ENABLE_SECURE_PDF = process.env.EXPO_PUBLIC_ENABLE_SECURE_PDF === 'true';
const ENABLE_RAZORPAY = process.env.EXPO_PUBLIC_ENABLE_RAZORPAY === 'true';

export default {
  expo: {
    name: IS_DEV ? 'Mathematico (Dev)' : 'Mathematico',
    slug: 'mathematico-app',
    version: '8.2.0',
    jsEngine: 'jsc',
    orientation: 'portrait',
    owner: 'mathematico',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '48a013c9-f058-4b62-8a9f-915b4a9446d9'
      },
      enableSecurePdf: ENABLE_SECURE_PDF,
      enableRazorpay: ENABLE_RAZORPAY
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 12,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      }
    },
    plugins: [
      'expo-secure-store',
      'expo-font',
      ...(ENABLE_RAZORPAY ? ['./plugins/withRazorpay.js'] : []),
      ...(IS_DEV ? ['expo-dev-client'] : [])
    ]
  }
};