'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Language = 'en' | 'az';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation cache to prevent re-fetching
const translationCache: Record<Language, Record<string, any>> = {
  en: {},
  az: {}
};

// Helper function to extract language from URL
function getLanguageFromPath(pathname: string | null): Language {
  if (!pathname) return 'az';
  
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment === 'en' || firstSegment === 'az') {
    return firstSegment as Language;
  }
  
  return 'az'; // Default to Azerbaijani
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Get language from URL path
  const urlLanguage = getLanguageFromPath(pathname);
  
  const [language, setLanguageState] = useState<Language>(urlLanguage);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const loadingRef = useRef(false);

  // Sync language state with URL changes
  useEffect(() => {
    const newLanguage = getLanguageFromPath(pathname);
    if (newLanguage !== language) {
      setLanguageState(newLanguage);
    }
  }, [pathname]);

  // Initialize from URL on mount
  useEffect(() => {
    if (!isInitialized) {
      const urlLang = getLanguageFromPath(pathname);
      setLanguageState(urlLang);
      setIsInitialized(true);
    }
  }, [isInitialized, pathname]);

  // Load translations when language changes
  useEffect(() => {
    if (!isInitialized) return;

    const loadTranslations = async () => {
      // Prevent multiple simultaneous loads
      if (loadingRef.current) return;
      
      // Check if translations are already cached
      if (translationCache[language] && Object.keys(translationCache[language]).length > 0) {
        setTranslations(translationCache[language]);
        setIsLoading(false);
        return;
      }

      loadingRef.current = true;
      setIsLoading(true);

      try {
        const response = await fetch(`/locales/${language}/common.json`);
        if (response.ok) {
          const data = await response.json();
          // Cache the translations
          translationCache[language] = data;
          setTranslations(data);
        } else {
          console.error(`Failed to load translations for ${language}`);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    loadTranslations();
  }, [language, isInitialized]);

  // Function to change language and update URL
  const setLanguage = (newLanguage: Language) => {
    if (newLanguage === language) return;
    
    // Get current path without language prefix
    const segments = pathname?.split('/').filter(Boolean) || [];
    const currentLang = segments[0];
    
    let newPath: string;
    if (currentLang === 'en' || currentLang === 'az') {
      // Replace existing language prefix
      segments[0] = newLanguage;
      newPath = '/' + segments.join('/');
    } else {
      // Add language prefix
      newPath = `/${newLanguage}${pathname || ''}`;
    }
    
    // Update state immediately for instant UI response
    setLanguageState(newLanguage);
    
    // Navigate to new URL (this will trigger the sync effect above)
    router.push(newPath);
  };

  // Translation function with interpolation support
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Return empty string instead of key while loading
        return isLoading ? '' : key;
      }
    }

    if (typeof value === 'string') {
      // Handle interpolation
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return params[paramKey]?.toString() || match;
        });
      }
      return value;
    }

    return isLoading ? '' : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
