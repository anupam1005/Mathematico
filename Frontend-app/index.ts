// CRITICAL: Import global error handler FIRST to prevent frozen error object issues
import './src/utils/globalErrorHandler';
import "react-native-gesture-handler";
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);