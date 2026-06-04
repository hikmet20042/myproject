'use client';

import React, { useRef, useEffect } from 'react';
import { Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement, } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import EmptyState from '@/components/shared/EmptyState';

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

interface SimpleChartProps { type: 'line' | 'bar' | 'pie';
  data: any;
  options?: any; }

export default function SimpleChart({ type, data, options }: SimpleChartProps) { const chartRef = useRef<any>(null);
  const defaultOptions = { responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const, }, }, };

  const chartOptions = { ...defaultOptions, ...options };

  useEffect(() => { const chartInstance = chartRef.current;
    return () => { // Cleanup chart instance when component unmounts
      if (chartInstance) { chartInstance.destroy(); } }; }, []);

  const hasData = data && data.datasets && Array.isArray(data.datasets) && data.datasets.length > 0

  const titleMap: Record<'line' | 'bar' | 'pie', string> = { line: 'Trendlər Qrafiki',
    bar: 'Müqayisə Qrafiki',
    pie: 'Paylanma Qrafiki', }
  const titleText = titleMap[type]

  const combinedOptions = { ...chartOptions,
    plugins: { ...chartOptions.plugins,
      title: { display: true,
        text: titleText, }, }, }

  const commonProps = { ref: chartRef,
    data: data,
    options: combinedOptions, };

  switch (type) { case 'line':
      return (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          {!hasData ? (
            <EmptyState variant="chart" message="Məlumat yoxdur" />
          ) : (
            <Line {...commonProps} />
          )}
        </div>
      );
    case 'bar':
      return (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          {!hasData ? (
            <EmptyState variant="chart" message="Məlumat yoxdur" />
          ) : (
            <Bar {...commonProps} />
          )}
        </div>
      );
    case 'pie':
      return (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          {!hasData ? (
            <EmptyState variant="chart" message="Məlumat yoxdur" />
          ) : (
            <Pie {...commonProps} />
          )}
        </div>
      );
    default:
      return null; } }
