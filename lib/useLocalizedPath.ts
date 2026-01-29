import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook to get localized path with language prefix
 * Usage: const localePath = useLocalizedPath('/blogs') => '/az/blogs' or '/en/blogs'
 */
export function useLocalizedPath() {
  const { language } = useLanguage();

  return useCallback((path: string) => {
    // Don't add prefix to API routes or external links
    if (
      path.startsWith('/api') ||
      path.startsWith('http') ||
      path.startsWith('mailto:') ||
      path.startsWith('tel:') ||
      path.startsWith('#') ||
      path.startsWith('javascript:')
    ) {
      return path;
    }

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // Guard against already-prefixed paths like '/az/...' or '/en/...'
    if (cleanPath.startsWith('az/') || cleanPath.startsWith('en/')) {
      return `/${cleanPath}`;
    }

    // Add language prefix
    return `/${language}/${cleanPath}`;
  }, [language]);
}
