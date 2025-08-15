'use client';

import React, { useRef, useEffect } from 'react';
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

  const commonProps = {
    ref: chartRef,
    data: data,
    options: chartOptions,
  };

  switch (type) {
    case 'line':
      return (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          <Line {...commonProps} />
        </div>
      );
    case 'bar':
      return (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          <Bar {...commonProps} />
        </div>
      );
    case 'pie':
      return (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          <Pie {...commonProps} />
        </div>
      );
    default:
      return null;
  }
}
