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
    orientation: 'portrait',
    owner: 'eas-dev',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '2b2cdce0-4d37-4b4b-a83e-305b26c855e9'
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