/** Supported locales — add new ones here and create translation files */
export const LOCALES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  hi: 'हिन्दी',
} as const;

export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_LIST = Object.entries(LOCALES).map(([code, name]) => ({
  code,
  name,
}));
