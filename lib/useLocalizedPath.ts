import { useCallback } from 'react';

/**
 * Hook to normalize internal paths.
 * Usage: const localePath = useLocalizedPath(); localePath('/blogs') => '/blogs'
 */
export function useLocalizedPath() {
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

    // Strip legacy language prefixes from incoming paths.
    if (cleanPath.startsWith('az/') || cleanPath.startsWith('en/')) {
      return `/${cleanPath.split('/').slice(1).join('/')}`;
    }

    return `/${cleanPath}`;
  }, []);
}
