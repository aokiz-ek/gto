'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { en, type TranslationKeys } from './locales/en';
import { zhCN } from './locales/zh-CN';

// Supported locales
export type Locale = 'en' | 'zh-CN';

export const LOCALES: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
];

export const DEFAULT_LOCALE: Locale = 'en';

// Translation map
const translations: Record<Locale, TranslationKeys> = {
  en,
  'zh-CN': zhCN,
};

// Storage key
const LOCALE_STORAGE_KEY = 'gto-locale';

// Detect browser language
function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || '';

  // Check for Chinese variants
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }

  // Check for exact match
  const exactMatch = LOCALES.find(l => l.code === browserLang);
  if (exactMatch) return exactMatch.code;

  // Check for language code match (e.g., 'en-US' -> 'en')
  const langCode = browserLang.split('-')[0];
  const partialMatch = LOCALES.find(l => l.code.startsWith(langCode));
  if (partialMatch) return partialMatch.code;

  return DEFAULT_LOCALE;
}

// Get stored locale
function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && LOCALES.some(l => l.code === stored)) {
      return stored as Locale;
    }
  } catch {
    // localStorage might not be available
  }
  return null;
}

// Store locale
function storeLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage might not be available
  }
}

// Context type
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
  locales: typeof LOCALES;
}

// Create context
const I18nContext = createContext<I18nContextType | null>(null);

// Provider component
interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export function I18nProvider({ children, defaultLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Use default locale for SSR
    if (typeof window === 'undefined') {
      return defaultLocale || DEFAULT_LOCALE;
    }

    // Check stored preference first
    const stored = getStoredLocale();
    if (stored) return stored;

    // Otherwise detect from browser
    return detectBrowserLocale();
  });

  const [hydrated, setHydrated] = useState(false);

  // Hydrate on client
  useEffect(() => {
    if (!hydrated) {
      const stored = getStoredLocale();
      if (stored) {
        setLocaleState(stored);
      } else {
        const detected = detectBrowserLocale();
        setLocaleState(detected);
      }
      setHydrated(true);
    }
  }, [hydrated]);

  // Update document lang attribute
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = locale === 'zh-CN' ? 'zh' : locale;
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    storeLocale(newLocale);
  }, []);

  const t = useMemo(() => translations[locale], [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      locales: LOCALES,
    }),
    [locale, setLocale, t]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use i18n
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Hook to get translations only (lighter weight)
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}

// Hook to get locale management
export function useLocale() {
  const { locale, setLocale, locales } = useI18n();
  return { locale, setLocale, locales };
}

// Export types and translations for external use
export type { TranslationKeys };
export { en, zhCN };
