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
const searchCache = new LRUCache({
  ...CACHE_OPTIONS,
  ttl: 1000 * 60 * 2, // 2 minutes for search suggestions/results
});
const vacanciesCache = new LRUCache({
  ...CACHE_OPTIONS,
  ttl: 1000 * 60 * 3,
});
const eventsCache = new LRUCache({
  ...CACHE_OPTIONS,
  ttl: 1000 * 60 * 3,
});


// Cache key generators
export const generateCacheKey = {
  userStats: (userId: string) => `user_stats_${userId}`,
  blogs: (page: number, limit: number, search?: string, tags?: string[], status?: string, sortBy?: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search) params.set('search', search);
    if (tags?.length) params.set('tags', tags.join(','));
    if (status) params.set('status', status);
    if (sortBy) params.set('sortBy', sortBy);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return `stories_${params.toString()}`;
  },
  search: (query: string, types: string[], page: number, limit: number) => {
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('types', types.join(','));
    params.set('page', String(page));
    params.set('limit', String(limit));
    return `search_${params.toString()}`;
  },
  vacancies: (page: number, limit: number, search?: string, type?: string, city?: string, sortBy?: string, sortOrder?: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search) params.set('search', search);
    if (type) params.set('type', type);
    if (city) params.set('city', city);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return `vacancies_${params.toString()}`;
  },
  events: (page: number, limit: number, search?: string, eventType?: string, city?: string, category?: string, sortBy?: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search) params.set('search', search);
    if (eventType) params.set('eventType', eventType);
    if (city) params.set('city', city);
    if (category) params.set('category', category);
    if (sortBy) params.set('sortBy', sortBy);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return `events_${params.toString()}`;
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
  search: {
    get: (key: string) => searchCache.get(key),
    set: (key: string, value: any) => searchCache.set(key, value),
    delete: (key: string) => searchCache.delete(key),
    clear: () => searchCache.clear(),
  },
  vacancies: {
    get: (key: string) => vacanciesCache.get(key),
    set: (key: string, value: any) => vacanciesCache.set(key, value),
    delete: (key: string) => vacanciesCache.delete(key),
    clear: () => vacanciesCache.clear(),
    invalidateAll: () => vacanciesCache.clear(),
  },
  events: {
    get: (key: string) => eventsCache.get(key),
    set: (key: string, value: any) => eventsCache.set(key, value),
    delete: (key: string) => eventsCache.delete(key),
    clear: () => eventsCache.clear(),
    invalidateAll: () => eventsCache.clear(),
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