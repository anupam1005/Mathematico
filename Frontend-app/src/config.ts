// PRODUCTION API BASE URL - STRICT CONFIGURATION
// ENFORCE: No fallbacks, no defaults, no silent failures
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// STRICT VALIDATION: Fail fast if configuration is invalid
if (!API_BASE_URL || typeof API_BASE_URL !== 'string') {
  throw new Error("CRITICAL: EXPO_PUBLIC_API_BASE_URL must be defined as a string");
}

if (!API_BASE_URL.startsWith("https://")) {
  throw new Error("CRITICAL: EXPO_PUBLIC_API_BASE_URL must start with https://");
}

// PRODUCTION DEBUG: Log the validated API base URL
console.log("API_BASE_URL:", API_BASE_URL);

export { API_BASE_URL };
