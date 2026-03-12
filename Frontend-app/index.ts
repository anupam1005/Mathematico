import { setupGlobalErrorHandler } from './src/utils/globalErrorHandler';
import "react-native-gesture-handler";
import { registerRootComponent } from 'expo';
import App from './App';
import { API_BASE_URL } from './src/config';

// Initialize global error handling as early as possible
setupGlobalErrorHandler();

// Runtime configuration log (requested for production migration validation)
console.log('API_BASE_URL:', API_BASE_URL);

registerRootComponent(App);