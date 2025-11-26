import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationFR from './locales/fr.json';
import translationEN from './locales/en.json';
import translationES from './locales/es.json';
import translationPT from './locales/pt.json';
import translationZH from './locales/zh.json';
import translationDE from './locales/de.json';

// Resources object with translations
const resources = {
  fr: {
    translation: translationFR,
  },
  en: {
    translation: translationEN,
  },
  es: {
    translation: translationES,
  },
  pt: {
    translation: translationPT,
  },
  zh: {
    translation: translationZH,
  },
  de: {
    translation: translationDE,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;