const ENABLE_SECURE_PDF = true;
const ENABLE_RAZORPAY = true;

export default {
  expo: {
    name: 'Mathematico',
    slug: 'mathematico-app',
    version: '8.2.1',
    jsEngine: 'hermes',
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
      versionCode: 13,
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