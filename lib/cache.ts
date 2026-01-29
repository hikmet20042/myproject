import { LRUCache } from 'lru-cache';

// Cache configuration
const CACHE_OPTIONS = {
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes TTL
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
};

// Create cache instances for different data types
const userStatsCache = new LRUCache(CACHE_OPTIONS);
const storiesCache = new LRUCache({
  ...CACHE_OPTIONS,
  ttl: 1000 * 60 * 2, // 2 minutes for stories (more dynamic)
});


// Cache key generators
export const generateCacheKey = {
  userStats: (userId: string) => `user_stats_${userId}`,
  blogs: (page: number, limit: number, search?: string, tags?: string[], status?: string) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search) params.set('search', search);
    if (tags?.length) params.set('tags', tags.join(','));
    if (status) params.set('status', status);
    return `stories_${params.toString()}`;
  },

};

// Cache operations
export const cache = {
  // User stats cache
  userStats: {
    get: (key: string) => userStatsCache.get(key),
    set: (key: string, value: any) => userStatsCache.set(key, value),
    delete: (key: string) => userStatsCache.delete(key),
    clear: () => userStatsCache.clear(),
  },
  
  // Stories cache
  blogs: {
    get: (key: string) => storiesCache.get(key),
    set: (key: string, value: any) => storiesCache.set(key, value),
    delete: (key: string) => storiesCache.delete(key),
    clear: () => storiesCache.clear(),
    // Clear all stories cache when new story is added/updated
    invalidateAll: () => storiesCache.clear(),
  },
  

};

// Cache invalidation helpers
export const invalidateUserCache = (userId: string) => {
  // Clear user-specific caches
  cache.userStats.delete(generateCacheKey.userStats(userId));
  

};

// Wrapper function for caching database queries
export const withCache = async <T>(
  cacheInstance: { get: (key: string) => T | undefined; set: (key: string, value: T) => void },
  key: string,
  fetchFunction: () => Promise<T>
): Promise<T> => {
  // Try to get from cache first
  const cached = cacheInstance.get(key);
  if (cached !== undefined) {
    return cached;
  }
  
  // If not in cache, fetch from database
  const result = await fetchFunction();
  
  // Store in cache
  cacheInstance.set(key, result);
  
  return result;
};

export default cache;