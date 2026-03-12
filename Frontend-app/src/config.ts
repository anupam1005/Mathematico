// PRODUCTION API BASE URL - STRICT CONFIGURATION
// ENFORCE: No fallbacks to any old domain allowed.
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

type EnvConfigErrorCode =
  | 'ENV_MISSING_EXPO_PUBLIC_API_BASE_URL'
  | 'ENV_INVALID_EXPO_PUBLIC_API_BASE_URL'
  | 'ENV_INSECURE_EXPO_PUBLIC_API_BASE_URL';

class EnvConfigError extends Error {
  public readonly name = 'EnvConfigError';
  public readonly code: EnvConfigErrorCode;
  public readonly details: Record<string, any>;

  constructor(code: EnvConfigErrorCode, message: string, details: Record<string, any> = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// STRICT VALIDATION: Fail fast if configuration is invalid
if (!API_BASE_URL) {
  throw new EnvConfigError(
    'ENV_MISSING_EXPO_PUBLIC_API_BASE_URL',
    [
      'CRITICAL CONFIG ERROR: Missing EXPO_PUBLIC_API_BASE_URL.',
      '',
      'How to fix:',
      '- EAS Build: ensure `eas.json` includes `build.<profile>.env.EXPO_PUBLIC_API_BASE_URL`.',
      '- Local dev: set EXPO_PUBLIC_API_BASE_URL in your shell or `.env` (not committed).',
      '',
      'Expected (production): https://api.mathematico.in',
    ].join('\n'),
    { envKey: 'EXPO_PUBLIC_API_BASE_URL' }
  );
}

if (typeof API_BASE_URL !== 'string') {
  throw new EnvConfigError(
    'ENV_INVALID_EXPO_PUBLIC_API_BASE_URL',
    'CRITICAL CONFIG ERROR: EXPO_PUBLIC_API_BASE_URL must be a string.',
    { actualType: typeof API_BASE_URL }
  );
}

if (!API_BASE_URL.startsWith('https://')) {
  throw new EnvConfigError(
    'ENV_INSECURE_EXPO_PUBLIC_API_BASE_URL',
    [
      'CRITICAL CONFIG ERROR: EXPO_PUBLIC_API_BASE_URL must start with https://',
      '',
      `Received: ${API_BASE_URL}`,
      'Note: Cleartext (http://) is blocked by Android network security config in production builds.',
    ].join('\n'),
    { received: API_BASE_URL }
  );
}
