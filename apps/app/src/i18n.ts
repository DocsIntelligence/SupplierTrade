import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { DEFAULT_LOCALE } from '@org/utils';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LOCALE,
    // Resolve region variants to the base language so an `hi-IN` device gets
    // Hindi automatically (key for the rural Indian audience); a big in-app
    // EN | हिंदी toggle lets anyone switch at any time.
    supportedLngs: ['en', 'es', 'fr', 'de', 'hi'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    debug: false,
    interpolation: { escapeValue: false },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
