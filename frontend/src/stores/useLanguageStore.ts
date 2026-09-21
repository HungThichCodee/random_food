import { create } from 'zustand';
import i18n from '../i18n';

interface LanguageState {
  currentLanguage: string;
  toggleLanguage: () => void;
  setLanguage: (lang: string) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  currentLanguage: i18n.language || 'vi',
  toggleLanguage: () =>
    set((state) => {
      const newLang = state.currentLanguage === 'vi' ? 'en' : 'vi';
      i18n.changeLanguage(newLang);
      return { currentLanguage: newLang };
    }),
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ currentLanguage: lang });
  },
}));
