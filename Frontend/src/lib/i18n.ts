import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { CONFIG } from '@/config/app';

// Import translations
import enTranslation from '@/locales/en/translation.json';
import esTranslation from '@/locales/es/translation.json';

// Resources type
type Resources = {
  [key: string]: {
    translation: Record<string, any>;
  };
};

// Available languages
export const LANGUAGES = {
  en: 'English',
  es: 'Español',
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Resources
const resources: Resources = {
  en: {
    translation: enTranslation,
  },
  es: {
    translation: esTranslation,
  },
};

// Initialize i18n
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: CONFIG.APP.DEBUG,
    interpolation: {
      escapeValue: false, // Not needed for React
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: true,
    },
  });

/**
 * Change the application language
 * @param language The language code to change to
 */
export const changeLanguage = async (language: LanguageCode): Promise<void> => {
  await i18n.changeLanguage(language);
  localStorage.setItem('i18nextLng', language);
};

/**
 * Get the current language
 * @returns The current language code
 */
export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language || 'en') as LanguageCode;
};

/**
 * Translate a key with optional parameters
 * @param key The translation key
 * @param params Optional parameters for the translation
 * @returns The translated string
 */
export const translate = (key: string, params?: Record<string, any>): string => {
  return i18n.t(key, params);
};

export default i18n;
