import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'es' | 'de';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orion_language') as SupportedLanguage;
      if (['en', 'hi', 'es', 'de'].includes(saved)) {
        return saved;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('orion_language', lang);
      window.dispatchEvent(new CustomEvent('orion-language-changed', { detail: { language: lang } }));
    }
  };

  useEffect(() => {
    const handleLangChange = (e: any) => {
      if (e.detail?.language && e.detail.language !== language) {
        setLanguageState(e.detail.language);
      }
    };
    window.addEventListener('orion-language-changed', handleLangChange);
    return () => window.removeEventListener('orion-language-changed', handleLangChange);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
