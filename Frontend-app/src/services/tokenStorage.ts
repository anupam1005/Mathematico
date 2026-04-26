import { Storage } from '../utils/storage';
import { safeCatch } from '../utils/safeCatch';

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface SessionData {
  user: any | null;
  tokens: AuthTokens;
}

const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let memoryUser: any | null = null;
let hydrated = false;
let hydrationPromise: Promise<void> | null = null;

const normalizeToken = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
};

const parseJson = <T = any>(value: unknown): T | null => {
  if (!value) return null;
  if (typeof value !== 'string') return (value as T) ?? null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    safeCatch('tokenStorage.parseJson')(error);
    return null;
  }
};

const persistAccessToken = async (token: string | null): Promise<void> => {
  if (token) {
    await Storage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }
  await Storage.deleteItem(ACCESS_TOKEN_KEY);
};

const persistRefreshToken = async (token: string | null): Promise<void> => {
  if (token) {
    await Storage.setItem(REFRESH_TOKEN_KEY, token);
    return;
  }
  await Storage.deleteItem(REFRESH_TOKEN_KEY);
};

const persistUser = async (user: any | null): Promise<void> => {
  if (user) {
    await Storage.setItem(USER_KEY, JSON.stringify(user));
    return;
  }
  await Storage.deleteItem(USER_KEY);
};

const hydrateMemoryCache = async (): Promise<void> => {
  if (hydrated) return;
  if (hydrationPromise) {
    await hydrationPromise;
    return;
  }

  hydrationPromise = (async () => {
    try {
      const storedAccess = await Storage.getItem<string>(ACCESS_TOKEN_KEY, false);
      const storedRefresh = await Storage.getItem<string>(REFRESH_TOKEN_KEY, false);
      const storedUser = await Storage.getItem<string>(USER_KEY, false);

      memoryAccessToken = normalizeToken(storedAccess);
      memoryRefreshToken = normalizeToken(storedRefresh);
      memoryUser = parseJson(storedUser);
    } catch (error) {
      safeCatch('tokenStorage.hydrateMemoryCache')(error);
      memoryAccessToken = null;
      memoryRefreshToken = null;
      memoryUser = null;
    } finally {
      hydrated = true;
      hydrationPromise = null;
    }
  })();

  await hydrationPromise;
};

export const tokenStorage = {
  async hydrate(): Promise<void> {
    await hydrateMemoryCache();
  },

  async getAccessToken(): Promise<string | null> {
    await hydrateMemoryCache();
    return memoryAccessToken;
  },

  async getRefreshToken(): Promise<string | null> {
    await hydrateMemoryCache();
    return memoryRefreshToken;
  },

  async getUser<T = any>(): Promise<T | null> {
    await hydrateMemoryCache();
    return memoryUser as T | null;
  },

  async setAccessToken(token: string | null): Promise<void> {
    await hydrateMemoryCache();
    memoryAccessToken = normalizeToken(token);
    await persistAccessToken(memoryAccessToken);
  },

  async setRefreshToken(token: string | null): Promise<void> {
    await hydrateMemoryCache();
    memoryRefreshToken = normalizeToken(token);
    await persistRefreshToken(memoryRefreshToken);
  },

  async setUser(user: any | null): Promise<void> {
    await hydrateMemoryCache();
    memoryUser = user ?? null;
    await persistUser(memoryUser);
  },

  async setSession(session: SessionData): Promise<void> {
    await hydrateMemoryCache();
    const { user, tokens } = session;
    const normalizedAccess = normalizeToken(tokens.accessToken);
    const normalizedRefresh = normalizeToken(tokens.refreshToken);

    memoryAccessToken = normalizedAccess;
    memoryRefreshToken = normalizedRefresh;
    memoryUser = user ?? null;

    await persistAccessToken(memoryAccessToken);
    await persistRefreshToken(memoryRefreshToken);
    await persistUser(memoryUser);
  },

  async getSession<T = any>(): Promise<{ user: T | null; accessToken: string | null; refreshToken: string | null }> {
    await hydrateMemoryCache();
    return {
      user: memoryUser as T | null,
      accessToken: memoryAccessToken,
      refreshToken: memoryRefreshToken,
    };
  },

  async clearSession(): Promise<void> {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    memoryUser = null;
    hydrated = true;
    await Storage.deleteItem(ACCESS_TOKEN_KEY);
    await Storage.deleteItem(REFRESH_TOKEN_KEY);
    await Storage.deleteItem(USER_KEY);
  },
};

export default tokenStorage;
