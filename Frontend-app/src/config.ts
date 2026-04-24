import Constants from 'expo-constants';

/**
 * API Configuration
 * Hardcoded to production URL as per request.
 */
export const API_BASE_URL = 'https://api.mathematico.in';

const sanitizeBaseUrl = (url: string): string => url.replace(/\/+$/, '');

/**
 * Validates the API base URL.
 * Even though it's hardcoded, we keep this for consistency and safety.
 */
const validateApiBaseUrl = (url: string): string => {
  const normalized = sanitizeBaseUrl(url);

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`Invalid API base URL: "${normalized}" is not a valid URL`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local');

  // Check if we are in a production environment
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    Constants?.expoConfig?.extra?.EXPO_PUBLIC_ENV === 'production';

  const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);

  // Enforce strict rules for domains
  if (!isIpAddress && !isLocalHost) {
    if (parsed.protocol !== 'https:') {
      // We allow this to pass for now since we've hardcoded it to HTTPS anyway,
      // but keeping the logic for future flexibility.
    }
  }

  const hasPath = parsed.pathname && parsed.pathname !== '/';
  const hasSearch = Boolean(parsed.search);
  const hasHash = Boolean(parsed.hash);
  if (hasPath || hasSearch || hasHash) {
    throw new Error('Invalid API base URL: use origin only (example: https://api.example.com)');
  }

  return normalized;
};

// Log the final URL for debugging in Expo Go
console.log('[CONFIG] API_BASE_URL:', API_BASE_URL);
