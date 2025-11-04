'use client';

import React, { useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext'
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
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

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
);

interface SimpleChartProps {
  type: 'line' | 'bar' | 'pie';
  data: any;
  options?: any;
}

export default function SimpleChart({ type, data, options }: SimpleChartProps) {
  const chartRef = useRef<any>(null);
  const { t } = useLanguage()

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const chartOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    const chartInstance = chartRef.current;
    return () => {
      // Cleanup chart instance when component unmounts
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, []);

  const hasData = data && data.datasets && Array.isArray(data.datasets) && data.datasets.length > 0

  // Localized title per chart type
  const titleText = t(`charts.simple.title.${type}`)

  const combinedOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: titleText,
      },
    },
  }

  const commonProps = {
    ref: chartRef,
    data: data,
    options: combinedOptions,
  };

  switch (type) {
    case 'line':
      return (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          {!hasData ? (
            <div className="flex items-center justify-center h-80 text-gray-500">{t('charts.simple.noData')}</div>
          ) : (
            <Line {...commonProps} />
          )}
        </div>
      );
    case 'bar':
      return (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          {!hasData ? (
            <div className="flex items-center justify-center h-80 text-gray-500">{t('charts.simple.noData')}</div>
          ) : (
            <Bar {...commonProps} />
          )}
        </div>
      );
    case 'pie':
      return (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          {!hasData ? (
            <div className="flex items-center justify-center h-80 text-gray-500">{t('charts.simple.noData')}</div>
          ) : (
            <Pie {...commonProps} />
          )}
        </div>
      );
    default:
      return null;
  }
}
