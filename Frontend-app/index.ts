import { setupGlobalErrorHandler } from './src/utils/globalErrorHandler';
import "react-native-gesture-handler";
import { registerRootComponent } from 'expo';
import App from './App';

// Initialize global error handling as early as possible
setupGlobalErrorHandler();

registerRootComponent(App);