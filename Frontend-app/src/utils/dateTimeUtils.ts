import { Platform } from 'react-native';
import moment from 'moment-timezone';

// Set the default timezone (adjust as needed)
const APP_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats a date to a consistent format for display
 */
export const formatDateTime = (date: Date | string, format = 'DD MMM YYYY, hh:mm A') => {
  return moment(date).tz(APP_TIMEZONE).format(format);
};

/**
 * Converts a date to ISO string with timezone handling
 */
export const toISODateTime = (date: Date) => {
  return moment(date).tz(APP_TIMEZONE).toISOString();
};

/**
 * Combines date and time from separate pickers
 */
export const combineDateTime = (date: Date, time: Date): Date => {
  const combined = new Date(date);
  combined.setHours(time.getHours());
  combined.setMinutes(time.getMinutes());
  combined.setSeconds(0);
  combined.setMilliseconds(0);
  return combined;
};

/**
 * Validates if end time is after start time
 */
export const validateTimeRange = (start: Date, end: Date): boolean => {
  return end > start;
};

/**
 * Platform-specific date picker props
 */
export const getDateTimePickerProps = () => ({
  mode: Platform.OS === 'ios' ? 'datetime' : 'default',
  is24Hour: false,
  display: Platform.OS === 'ios' ? 'spinner' : 'default',
});
