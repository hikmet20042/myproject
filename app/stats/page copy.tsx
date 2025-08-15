'use client';

import { useState, useEffect, useMemo } from 'react';
import SimpleChart from '@/components/SimpleChart';

interface StatsData {
  lastUpdated: string;
  disclaimer: string;
  summary: {
    totalNews: number;
    recentPeriod: number;
    changeFromPrevious: number;
    periodDays: number;
  };
  newsBySource: Array<{
    source: string;
    count: number;
    percentage: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    incidents: number;
  }>;
  period: string;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  // Stable chart options to prevent re-renders
  const pieChartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    }
  }), []);

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Incidents'
        }
      }
    }
  }), []);

  // Memoize chart data to prevent recreation on every render (MUST be before early returns)
  const sourceChartData = useMemo(() => {
    if (!stats?.newsBySource || stats.newsBySource.length === 0) {
      return null;
    }
    
    return {
      labels: stats.newsBySource.map(item => item.source),
      datasets: [{
        label: 'News Articles by Source',
        data: stats.newsBySource.map(item => item.count),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2
      }]
    };
  }, [stats?.newsBySource]);

  const monthlyChartData = useMemo(() => {
    if (!stats?.monthlyTrend || stats.monthlyTrend.length === 0) {
      return null;
    }
    
    return {
      labels: stats.monthlyTrend.map(item => {
        try {
          const [year, month] = item.month.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch {
          return item.month;
        }
      }),
      datasets: [{
        label: 'Monthly Incidents',
        data: stats.monthlyTrend.map(item => item.incidents),
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  }, [stats?.monthlyTrend]);

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();
    
    const fetchStats = async () => {
      try {
        if (!mounted) return;
        
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/stats?period=${selectedPeriod}`, {
          signal: abortController.signal
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        
        const data = await response.json();
        
        // Only update state if component is still mounted
        if (mounted) {
          setStats(data);
        }
      } catch (err) {
        if (mounted && (err as any)?.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'An error occurred');
          setStats(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    // Cleanup function
    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [selectedPeriod]);

  if (loading) {
    return (
  <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
  <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Error: {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
  <div className="min-h-screen bg-gray-50">
      

        {/* Hero Section (copied from About page) */}
  <section className="bg-primary text-white py-20 transition-colors duration-200 mb-8">
          <div className="section-padding">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Gender Violence News Statistics
              </h1>
              <p className="text-xl text-gray-100 leading-relaxed">
                {stats.disclaimer}
              </p>
              <p className="text-sm text-gray-200 mt-2">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Period Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Period:
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total News Articles</h3>
            <p className="text-3xl font-bold text-red-600">{stats.summary.totalNews.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Recent ({stats.summary.periodDays} days)
            </h3>
            <p className="text-3xl font-bold text-red-500">{stats.summary.recentPeriod.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Change from Previous</h3>
            <p className={`text-3xl font-bold ${stats.summary.changeFromPrevious >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.summary.changeFromPrevious > 0 ? '+' : ''}{stats.summary.changeFromPrevious.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">News Sources</h3>
            <p className="text-3xl font-bold text-red-400">{stats.newsBySource?.length || 0}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Source Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">News by Source</h2>
            <div className="mb-4">
              {stats.newsBySource?.map((source, index) => (
                <div key={`${source.source}-${index}`} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium text-gray-700">{source.source}</span>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{source.count}</span>
                    <span className="text-sm text-gray-500 ml-2">({source.percentage}%)</span>
                  </div>
                </div>
              )) || []}
            </div>
            {sourceChartData ? (
              <div key={`pie-${stats?.newsBySource?.length || 0}`}>
                <SimpleChart 
                  type="pie" 
                  data={sourceChartData}
                  options={pieChartOptions}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No source data available</p>
              </div>
            )}
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Monthly Trend (Last 6 Months)</h2>
            {monthlyChartData ? (
              <div key={`line-${stats?.monthlyTrend?.length || 0}`}>
                <SimpleChart 
                  type="line" 
                  data={monthlyChartData}
                  options={lineChartOptions}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No data available for monthly trend</p>
              </div>
            )}
          </div>
        </div>

        {/* Important Notice */}
  <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Important Notice</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  These statistics are compiled from news articles about gender-based violence reported by Azerbaijani news sources. 
                  The data represents reported incidents and may not reflect the full scope of gender-based violence in the region. 
                  If you or someone you know needs help, please contact local support services or emergency authorities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
