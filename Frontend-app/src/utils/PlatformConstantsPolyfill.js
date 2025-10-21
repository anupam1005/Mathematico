// PlatformConstants polyfill for Expo Go compatibility
import { Platform } from 'react-native';

const PlatformConstants = {
  // Basic platform info
  OS: Platform.OS,
  Version: Platform.Version,
  
  // Additional constants that might be needed
  isTesting: false,
  isDisableAnimations: false,
  
  // React Native specific constants
  reactNativeVersion: {
    major: 0,
    minor: 73,
    patch: 2,
  },
  
  // Platform specific constants
  ...(Platform.OS === 'android' && {
    // Android specific constants
    uiMode: 'normal',
    nightMode: 'notnight',
    // Add more Android constants as needed
    isDevice: true,
    isTablet: false,
  }),
  
  ...(Platform.OS === 'ios' && {
    // iOS specific constants
    forceTouchAvailable: false,
    interfaceIdiom: 'phone',
    // Add more iOS constants as needed
    isDevice: true,
    isTablet: false,
  }),
  
  // Web specific constants
  ...(Platform.OS === 'web' && {
    isDevice: true,
    isTablet: false,
  }),
};

// Export both default and named export for compatibility
export default PlatformConstants;
export { PlatformConstants };
