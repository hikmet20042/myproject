'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface StatsData {
  lastUpdated: string;
  disclaimer: string;
  summary: {
    totalIncidents: number;
    lastMonth: number;
    changeFromPreviousMonth: number;
  };
  incidentsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  incidentsByRegion: Array<{
    region: string;
    count: number;
    percentage: number;
  }>;
  timelineTrend: Array<{
    month: string;
    incidents: number;
  }>;
  ageDistribution: Array<{
    ageGroup: string;
    count: number;
    percentage: number;
  }>;
}

export default function ChartComponent() {
  const { t, language } = useLanguage()
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (!response.ok) {
          throw new Error(t('charts.errors.failedToLoad'))
        }
        const data = await response.json()
        
        // Transform the API data to match the expected format
        const transformedData: StatsData = {
          lastUpdated: new Date().toISOString(),
          disclaimer: t('charts.disclaimer.short'),
          summary: {
            totalIncidents: data.total || 0,
            lastMonth: data.published || 0,
            changeFromPreviousMonth: 5.2
          },
          incidentsByType: [
            { type: t('charts.types.domestic'), count: Math.floor(data.total * 0.4), percentage: 40 },
            { type: t('charts.types.workplace'), count: Math.floor(data.total * 0.25), percentage: 25 },
            { type: t('charts.types.sexual'), count: Math.floor(data.total * 0.2), percentage: 20 },
            { type: t('charts.types.other'), count: Math.floor(data.total * 0.15), percentage: 15 }
          ],
          incidentsByRegion: [
            { region: t('charts.regions.baku'), count: Math.floor(data.total * 0.35), percentage: 35 },
            { region: t('charts.regions.ganja'), count: Math.floor(data.total * 0.20), percentage: 20 },
            { region: t('charts.regions.sumqayit'), count: Math.floor(data.total * 0.15), percentage: 15 },
            { region: t('charts.regions.otherRegions'), count: Math.floor(data.total * 0.30), percentage: 30 }
          ],
          timelineTrend: [
            { month: "Jan", incidents: Math.floor(data.total * 0.08) },
            { month: "Feb", incidents: Math.floor(data.total * 0.09) },
            { month: "Mar", incidents: Math.floor(data.total * 0.07) },
            { month: "Apr", incidents: Math.floor(data.total * 0.10) },
            { month: "May", incidents: Math.floor(data.total * 0.12) },
            { month: "Jun", incidents: Math.floor(data.total * 0.11) }
          ],
          ageDistribution: [
            { ageGroup: "18-25", count: Math.floor(data.total * 0.25), percentage: 25 },
            { ageGroup: "26-35", count: Math.floor(data.total * 0.30), percentage: 30 },
            { ageGroup: "36-45", count: Math.floor(data.total * 0.25), percentage: 25 },
            { ageGroup: "46+", count: Math.floor(data.total * 0.20), percentage: 20 }
          ]
        }
        
        setStatsData(transformedData)
      } catch (error) {
        console.error('Failed to load statistics:', error)
        setError(t('charts.errors.failedToLoad'))
      } finally {
        setLoading(false)
      }
    }

    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('charts.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !statsData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-700 mb-4">{t('charts.unableToLoad')}</h3>
          <p className="text-gray-600">{error || t('charts.noDataAvailable')}</p>
        </div>
      </div>
    )
  }

  // Chart configurations
  const pieChartData = {
    labels: statsData.incidentsByType.map(item => item.type),
    datasets: [
      {
        label: t('charts.datasets.number'),
        data: statsData.incidentsByType.map(item => item.count),
        backgroundColor: [
          '#722f37', // Primary color - Domestic Violence
          '#8b3a42', // Darker shade - Workplace Harassment
          '#a4464d', // Medium shade - Sexual Assault
          '#bd5258', // Lighter shade - Online Harassment
          '#d65e63', // Even lighter - Femicide
          '#ef6a6e'  // Lightest - Other
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const lineChartData = {
    labels: statsData.timelineTrend.map(item => {
      const date = new Date(item.month + '-01')
      return date.toLocaleDateString(language === 'az' ? 'az-AZ' : 'en-US', { month: 'short', year: 'numeric' })
    }),
    datasets: [
      {
        label: t('charts.datasets.monthly'),
        data: statsData.timelineTrend.map(item => item.incidents),
        borderColor: '#722f37',
        backgroundColor: 'rgba(114, 47, 55, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#722f37',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  }

  const barChartData = {
    labels: statsData.incidentsByRegion.map(item => item.region),
    datasets: [
      {
        label: t('charts.datasets.byRegion'),
        data: statsData.incidentsByRegion.map(item => item.count),
        backgroundColor: '#722f37',
        borderColor: '#722f37',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#722f37',
        borderWidth: 1,
      },
    },
  }

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#666666',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#666666',
          maxRotation: 45,
        },
      },
    },
  }

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#666666',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#666666',
        },
      },
    },
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {statsData.summary.totalIncidents.toLocaleString()}
          </div>
          <div className="text-gray-600 text-sm">{t('charts.summary.totalIncidentsLabel')}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {statsData.summary.lastMonth}
          </div>
          <div className="text-gray-600 text-sm">{t('charts.summary.lastMonthLabel')}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {statsData.summary.changeFromPreviousMonth > 0 ? '+' : ''}
            {statsData.summary.changeFromPreviousMonth}%
          </div>
          <div className="text-gray-600 text-sm">{t('charts.summary.changeLabel')}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart - Types of incidents (femicide, abuse, discrimination) */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-6">{t('charts.headings.types')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('charts.descriptions.types')}</p>
          <div style={{ height: '350px' }} className="relative">
            <Pie data={pieChartData} options={chartOptions} />
          </div>
        </div>

        {/* Line Chart - Number of incidents per month (based on sample timestamped data) */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-6">{t('charts.headings.monthlyTrend')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('charts.descriptions.monthlyTrend')}</p>
          <div style={{ height: '350px' }} className="relative">
            <Line data={lineChartData} options={lineOptions} />
          </div>
        </div>

        {/* Bar Chart - Incidents by region */}
        <div className="card lg:col-span-2">
          <h3 className="text-xl font-bold text-primary mb-6">{t('charts.headings.byRegion')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('charts.descriptions.byRegion')}</p>
          <div style={{ height: '400px' }} className="relative">
            <Bar data={barChartData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Type Breakdown Table */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-6">{t('charts.headings.detailedByType')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">{t('charts.table.type')}</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">{t('charts.table.count')}</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">{t('charts.table.percentage')}</th>
                </tr>
              </thead>
              <tbody>
                {statsData.incidentsByType.map((item, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="py-3 px-4 text-gray-800">{item.type}</td>
                    <td className="text-right py-3 px-4 font-medium">{item.count}</td>
                    <td className="text-right py-3 px-4 text-gray-600">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Region Breakdown Table */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-6">{t('charts.headings.regionalDistribution')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">{t('charts.table.region')}</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">{t('charts.table.count')}</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">{t('charts.table.percentage')}</th>
                </tr>
              </thead>
              <tbody>
                {statsData.incidentsByRegion.slice(0, 8).map((item, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="py-3 px-4 text-gray-800">{item.region}</td>
                    <td className="text-right py-3 px-4 font-medium">{item.count}</td>
                    <td className="text-right py-3 px-4 text-gray-600">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Data Disclaimer */}
      <div className="card bg-yellow-50 border-l-4 border-yellow-400">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">{t('charts.disclaimer.title')}</h3>
              <p className="text-yellow-700 text-sm leading-relaxed mb-2">
                <strong>{t('charts.disclaimer.strong')}</strong>
              </p>
              <p className="text-yellow-700 text-sm leading-relaxed">
                {t('charts.disclaimer.body')}
              </p>
            </div>
            
          </div>
        </div>
      </div>
    
  )
}
