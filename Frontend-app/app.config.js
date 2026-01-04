const IS_DEV = process.env.APP_VARIANT === 'development';

// Feature flags (default off for debugging)
if (!process.env.EXPO_PUBLIC_ENABLE_SECURE_PDF) {
  process.env.EXPO_PUBLIC_ENABLE_SECURE_PDF = 'false';
}
if (!process.env.EXPO_PUBLIC_ENABLE_RAZORPAY) {
  process.env.EXPO_PUBLIC_ENABLE_RAZORPAY = 'false';
}

const ENABLE_SECURE_PDF = process.env.EXPO_PUBLIC_ENABLE_SECURE_PDF === 'true';
const ENABLE_RAZORPAY = process.env.EXPO_PUBLIC_ENABLE_RAZORPAY === 'true';

export default {
  expo: {
    name: IS_DEV ? 'Mathematico (Dev)' : 'Mathematico',
    slug: 'mathematico-app',
    version: '8.1.1',
    orientation: 'portrait',
    owner: 'anupam-dev',
    icon: './assets/icon.png',
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'f7a70815-47dc-4d9f-a832-8ee98ea1ab55'
      },
      enableSecurePdf: ENABLE_SECURE_PDF,
      enableRazorpay: ENABLE_RAZORPAY
    },
    android: {
      package: 'com.anupam1505.mathematicoapp',
      versionCode: 11,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      permissions: []
    },
    plugins: [
      'expo-secure-store',
      'expo-font',
      ...(ENABLE_RAZORPAY ? ['./plugins/withRazorpay.js'] : []),
      ...(IS_DEV ? ['expo-dev-client'] : [])
    ]
  }
};
