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
    owner: 'hexaanupam',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '16fc30f1-ac07-4fe1-9ca8-64b17f9ffad7'
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
