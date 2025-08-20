'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'

import RecentCommunityContent from '@/components/RecentCommunityContent'

interface Article {
  _id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceUrl: string;
  date: string;
  scrapedAt: string;
  contentLength: number;
  tags: string[];
}

interface ArticlesResponse {
  total: number;
  page: number;
  limit: number;
  results: Article[];
}

interface Filters {
  search: string;
  tags: string[];
  source: string;
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    tags: [],
    source: ''
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [searchDebounce, setSearchDebounce] = useState('');
  // Skip initial legacy fetch on first load to avoid double /api/news calls
  const [hasInitialLoaded, setHasInitialLoaded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const limit = 10;

  // Ensure component is mounted before making API calls
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => ({
    search: filters.search,
    tags: filters.tags,
    source: filters.source
  }), [filters.search, filters.tags, filters.source]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchDebounce }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchDebounce]);

  // ...removed useEffect that resets page on filters change...

  const fetchArticles = useCallback(async (page: number, currentFilters: Filters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters robustly (avoid undefined values)
      const queryParams = new URLSearchParams();
      queryParams.set('limit', String(limit));
      queryParams.set('page', String(page));

      const searchValue = (currentFilters.search || '').trim();
      if (searchValue) {
        queryParams.set('search', searchValue);
      }

      if (Array.isArray(currentFilters.tags) && currentFilters.tags.length > 0) {
        queryParams.set('tags', currentFilters.tags.join(','));
      }

      const sourceValue = currentFilters.source || '';
      if (sourceValue) {
        queryParams.set('source', sourceValue);
      }

      const response = await fetch(`/api/news?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      
      const data: ArticlesResponse = await response.json();
      setArticles((data && Array.isArray(data.results)) ? data.results : []);
      setCurrentPage(data.page);
      setTotalPages(Math.ceil(data.total / data.limit));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Fetch available tags and sources for filtering
  const fetchFilterOptions = useCallback(() => {
    // For now, using hardcoded values. Can be replaced with API calls later
    setAvailableTags([
      'gender-equality', 'women-rights', 'workplace', 'education', 
      'policy', 'legislation', 'violence', 'discrimination', 
      'empowerment', 'leadership', 'healthcare', 'economy'
    ]);
    
    setAvailableSources(['apa.az', 'qafqazinfo.az', 'oxu.az']);
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Initial legacy fetch was removed; homepage no longer renders this list.

  // Subsequent fetches when filters or page change (only after initial load and mounting)
  useEffect(() => {
    if (!mounted || !hasInitialLoaded || (currentPage === 1 && !memoizedFilters.search && memoizedFilters.tags.length === 0 && !memoizedFilters.source)) {
      return;
    }
      
      const loadFilteredArticles = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Build query parameters
          const queryParams = new URLSearchParams();
          queryParams.set('limit', String(limit));
          queryParams.set('page', String(currentPage));

          const searchVal = (memoizedFilters.search || '').trim();
          if (searchVal) {
            queryParams.set('search', searchVal);
          }

          if (Array.isArray(memoizedFilters.tags) && memoizedFilters.tags.length > 0) {
            queryParams.set('tags', memoizedFilters.tags.join(','));
          }

          const srcVal = memoizedFilters.source || '';
          if (srcVal) {
            queryParams.set('source', srcVal);
          }

          const response = await fetch(`/api/news?${queryParams.toString()}`, {
            cache: 'no-store' // Prevent caching issues
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
          }
          
          const data: ArticlesResponse = await response.json();
          setArticles((data && Array.isArray(data.results)) ? data.results : []);
          setCurrentPage(data.page);
          setTotalPages(Math.ceil(data.total / data.limit));
          
        } catch (err) {
          console.error('Filtered article load error:', err);
          setError(err instanceof Error ? err.message : 'Failed to load articles');
          setArticles([]);
        } finally {
          setLoading(false);
        }
      };

      loadFilteredArticles();
  }, [mounted, hasInitialLoaded, currentPage, memoizedFilters, limit]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchDebounce(value);
  };

  const handleTagToggle = (tag: string) => {
    setCurrentPage(1);
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSourceChange = (source: string) => {
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, source }));
  };

  const clearAllFilters = () => {
    setCurrentPage(1);
    setSearchDebounce('');
    setFilters({
      search: '',
      tags: [],
      source: ''
    });
  };

  const hasActiveFilters = filters.search || filters.tags.length > 0 || filters.source;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-white transition-colors duration-200">
        <div className="section-padding py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Advancing Social Justice in Azerbaijan
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-gray-100 leading-relaxed">
              A public service platform dedicated to promoting social justice and equality through 
              education, awareness, and transparent data analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/stats" 
                className="bg-white text-primary hover:bg-gray-100 hover:text-primary inline-block text-center font-semibold px-6 py-3 rounded-lg transition-all duration-200 min-w-[140px]"
              >
                View Statistics
              </Link>
              <Link 
                href="/resources" 
                className="bg-white text-primary hover:bg-gray-100 hover:text-primary inline-block text-center font-semibold px-6 py-3 rounded-lg transition-all duration-200 min-w-[140px]"
              >
                Learn More
              </Link>
              <Link 
                href="/stories" 
                className="bg-white text-primary hover:bg-gray-100 hover:text-primary inline-block text-center font-semibold px-6 py-3 rounded-lg transition-all duration-200 min-w-[140px]"
              >
                Community Stories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
  <section className="bg-white py-20 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-8">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Social injustice and inequality remain critical issues that affect countless lives. 
              Our platform aims to shed light on these problems through data-driven insights, 
              educational resources, and community engagement. We believe that transparency 
              and education are key to creating meaningful change.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="card text-center border-0">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Data Transparency</h3>
                <p className="text-gray-600">
                  AI-powered analysis of news sources to track and categorize social justice issues and inequalities.
                </p>
              </div>
              
              <div className="card text-center border-0">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Education</h3>
                <p className="text-gray-600">
                  Free resources, training materials, and courses to promote social justice and equality awareness.
                </p>
              </div>
              
              <div className="card text-center border-0">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Community</h3>
                <p className="text-gray-600">
                  A platform for sharing experiences, insights, and solutions through our community blog.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      

  {/* Recent community stories and articles */}
  {mounted && <RecentCommunityContent />}

      {/* Call to Action */}
  <section className="bg-accent py-20 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-primary mb-6">
              Get Involved
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Join us in the fight for social justice and equality. Whether you want to share your story, 
              access educational resources, or analyze the latest data, we provide the tools 
              you need to make a difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/submit/article/step1" className="btn-primary">
                Share Your Article
              </Link>
              <Link href="/submit/story/step1" className="btn-secondary">
                Share Your Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
  <section className="bg-gray-100 py-8 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-gray-600">
              <strong>Important Notice:</strong> This website is for educational and awareness purposes. 
              Data is collected from public news sources and analyzed using AI, which may contain inaccuracies. 
              Always verify critical information with official sources. In case of emergency, contact local authorities at 112.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
