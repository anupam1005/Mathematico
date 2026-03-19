import Constants from 'expo-constants';

const FALLBACK_API_BASE_URL = 'https://api.mathematico.in';

const readRuntimeApiBaseUrl = (): string | undefined => {
  const fromExtra = Constants?.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL;
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim();
  }

  const fromEnv = process?.env?.EXPO_PUBLIC_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  return undefined;
};

const sanitizeBaseUrl = (url: string): string => url.replace(/\/+$/, '');

const validateHttpsBaseUrl = (url: string): string => {
  const normalized = sanitizeBaseUrl(url);

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('Invalid API base URL: not a valid URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Invalid API base URL: HTTPS is required');
  }

  return normalized;
};

const resolveApiBaseUrl = (): string => {
  const runtimeUrl = readRuntimeApiBaseUrl();
  if (!runtimeUrl) {
    return FALLBACK_API_BASE_URL;
  }

  try {
    return validateHttpsBaseUrl(runtimeUrl);
  } catch {
    return FALLBACK_API_BASE_URL;
  }
};

export const API_BASE_URL = validateHttpsBaseUrl(resolveApiBaseUrl());
