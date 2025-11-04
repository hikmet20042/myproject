import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook to get localized path with language prefix
 * Usage: const localePath = useLocalizedPath('/blogs') => '/az/blogs' or '/en/blogs'
 */
export function useLocalizedPath() {
  const { language } = useLanguage();

  return (path: string) => {
    // Don't add prefix to API routes or external links
    if (path.startsWith('/api') || path.startsWith('http')) {
      return path;
    }

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Add language prefix
    return `/${language}/${cleanPath}`;
  };
}
