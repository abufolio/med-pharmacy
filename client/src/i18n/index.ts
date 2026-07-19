import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import uz from './uz.json';
import ru from './ru.json';

const savedLang = localStorage.getItem('language') || 'uz';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, uz: { translation: uz }, ru: { translation: ru } },
  lng: savedLang,
  fallbackLng: 'uz',
  interpolation: { escapeValue: false },
});

export default i18n;

export function changeLanguage(lang: 'uz' | 'ru' | 'en') {
  localStorage.setItem('language', lang);
  i18n.changeLanguage(lang);
}
