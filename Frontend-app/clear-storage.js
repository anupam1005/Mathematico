// Script to clear AsyncStorage (run this in the mobile app console)
import AsyncStorage from '@react-native-async-storage/async-storage';

const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('✅ All storage cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
};

clearStorage();
