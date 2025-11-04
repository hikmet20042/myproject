'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function LanguageSwitcher() {
  const { language, setLanguage, isLoading } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (newLang: 'en' | 'az') => {
    if (newLang !== language) {
      setLanguage(newLang);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 backdrop-blur-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
        aria-label="Change language"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <>
            <span className="text-lg">{currentLanguage?.flag}</span>
            <span className="text-sm font-semibold text-white">
              {currentLanguage?.code.toUpperCase()}
            </span>
          </>
        )}
      </button>

      {isOpen && !isLoading && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code as 'en' | 'az')}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3 ${
                language === lang.code ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {language === lang.code && (
                <span className="ml-auto">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
