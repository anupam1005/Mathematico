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
  }),
  
  ...(Platform.OS === 'ios' && {
    // iOS specific constants
    forceTouchAvailable: false,
    interfaceIdiom: 'phone',
  }),
};

export default PlatformConstants;
