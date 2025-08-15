'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ScrapingStats {
  total_articles: number;
  gender_related_count: number;
  gender_related_percentage: number;
  categories?: Record<string, number>;
  recent_gender_violence_cases?: Array<{
    title: string;
    url: string;
    category: string;
    confidence_score: number;
    analyzed_at: string;
  }>;
  session_results?: {
    urls_discovered: number;
    articles_processed: number;
    successful_analyses: number;
    errors: number;
  };
}

export default function ScraperControl() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  const [stats, setStats] = useState<ScrapingStats | null>(null);

  const runScraper = async (fastMode: boolean = false) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/scrape-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fastMode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Scraping completed successfully!' });
        setStats(data.stats);
      } else {
        // Handle different types of errors
        let errorMessage = data.error || 'Failed to run scraper';
        
        // Check for rate limit errors
        if (errorMessage.includes('Rate limit') || errorMessage.includes('rate limit')) {
          errorMessage = 'AI providers are currently rate limited. This is normal with free tier APIs. The scraper is working but processing slowly. Please try again in a few minutes or consider upgrading to paid API tiers for faster processing.';
        }
        
        // Check for timeout errors
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          errorMessage = 'Scraping operation timed out. This usually happens when AI providers are rate limited. The scraper may still be running in the background. Please wait a few minutes before trying again.';
        }
        
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const stopScraper = async () => {
    setStopping(true);
    setMessage(null);

    try {
      const response = await fetch('/api/scrape-news', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'warning', text: 'Scraper stop signal sent. Current batch will complete before stopping.' });
        setLoading(false); // Reset loading state
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to stop scraper' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setStopping(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/scrape-news', {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadStats();
    }
  }, [session]);

  if (!session) {
    return (
  <div className="bg-white rounded-lg shadow-lg p-6">
  <p className="text-gray-600">Please sign in to access scraper controls.</p>
      </div>
    );
  }

  return (
  <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
  <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bakuplus Gender Violence Scraper
        </h2>
  <p className="text-gray-600">
          Monitor and analyze gender violence cases from Azerbaijani news sources using AI-powered analysis.
        </p>
  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> The scraper uses free AI APIs which have rate limits. If processing seems slow or stops, 
            this is normal behavior. The system automatically handles rate limits and will continue processing. 
            Fast mode reduces the number of articles analyzed to work within API limits.
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-500'
            : message.type === 'warning'
            ? 'bg-yellow-100 text-yellow-700 border border-yellow-500'
            : 'bg-red-100 text-red-700 border border-red-500'
        }`}>
          {message.text}
        </div>
      )}

      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => runScraper(false)}
          disabled={loading || stopping}
          className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Running Scraper...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Run Scraper</span>
            </>
          )}
        </button>

        <button
          onClick={() => runScraper(true)}
          disabled={loading || stopping}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Fast Mode...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Fast Scrape (Recommended)</span>
            </>
          )}
        </button>

        {loading && (
          <button
            onClick={stopScraper}
            disabled={stopping}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {stopping ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Stopping...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10l6 6m0-6l-6 6" />
                </svg>
                <span>Stop Scraper</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={loadStats}
          disabled={statsLoading}
          className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {statsLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Refresh Stats</span>
            </>
          )}
        </button>
      </div>

      {stats && (
  <div className="mb-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Statistics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_articles || 0}
              </div>
              <div className="text-sm text-blue-800">Total Articles</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats.gender_related_count || 0}
              </div>
              <div className="text-sm text-red-800">Gender Violence Cases</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {(stats.gender_related_percentage || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-yellow-800">Detection Rate</div>
            </div>
          </div>

          {stats.session_results && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Last Session Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>URLs Discovered: <span className="font-medium">{stats.session_results.urls_discovered}</span></div>
                <div>Articles Processed: <span className="font-medium">{stats.session_results.articles_processed}</span></div>
                <div>Successful Analyses: <span className="font-medium">{stats.session_results.successful_analyses}</span></div>
                <div>Errors: <span className="font-medium">{stats.session_results.errors}</span></div>
              </div>
            </div>
          )}

          {stats.recent_gender_violence_cases && stats.recent_gender_violence_cases.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Recent Gender Violence Cases</h4>
              <div className="space-y-3">
                {stats.recent_gender_violence_cases.slice(0, 5).map((article, index) => (
                  <div key={index} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded">
                    <div className="font-medium text-gray-900">
                      {article.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Category: {article.category} • Confidence: {article.confidence_score}% • 
                      {new Date(article.analyzed_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

  <div className="border-t border-gray-200 pt-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Scraper Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-gray-700">Target Website:</strong>
            <ul className="mt-1 text-gray-600">
              <li>• bakuplus.az (Society, Crime, News)</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-700">AI Features:</strong>
            <ul className="mt-1 text-gray-600">
              <li>• Gender violence detection</li>
              <li>• Content analysis with OpenRouter/Gemini</li>
              <li>• Automatic categorization</li>
              <li>• SQLite data persistence</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
