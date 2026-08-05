import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import bn from './locales/bn.json';
import { useSettingsStore } from '../store/settingsStore';

const resources = {
  en: {
    translation: en,
  },
  bn: {
    translation: bn,
  },
};

const initialLang = useSettingsStore.getState().language;

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
