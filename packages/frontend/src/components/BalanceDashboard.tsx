'use client'

import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { useBalanceData, type BalanceTimeSeriesItem, type WalletTimeSeries } from '../hooks/useBalanceData';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

// Color palette for different wallet/network combinations
const colors = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
];

// Available exchanges - will be populated from data

export const BalanceDashboard: React.FC = () => {
  const [selectedExchange, setSelectedExchange] = useState('');
  
  const { data, isLoading, error } = useBalanceData({
    networkNames: 'ETH',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading balance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error loading balance data</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">No data available</div>
      </div>
    );
  }


  // Get available exchanges from wallet_time_series
  const availableExchangesFromData = Array.from(new Set(data.wallet_time_series.map(wallet => wallet.exchange_label).filter(Boolean)));
  
  // If no exchanges are available, show a fallback message
  if (availableExchangesFromData.length === 0) {
    availableExchangesFromData.push('Unknown');
  }

  // Filter wallet time series by selected exchange if any
  const filteredWalletSeries = selectedExchange ? 
    data.wallet_time_series.filter(wallet => wallet.exchange_label === selectedExchange) : 
    data.wallet_time_series;

  // Data is already grouped by wallet and exchange, so we can use it directly
  const timeSeriesData = filteredWalletSeries;

  // Prepare chart data for the overview chart (balance over time)
  // Flatten all data points from all wallets for the overview
  const allDataPoints = filteredWalletSeries.flatMap(wallet => 
    wallet.data_points.map(point => ({
      x: new Date(point.timestamp),
      y: parseFloat(point.balance) / Math.pow(10, 18), // Convert from wei to ether
      label: `${wallet.wallet_address.slice(0, 8)}...${wallet.wallet_address.slice(-6)} - ${wallet.exchange_label}`,
      exchange: wallet.exchange_label,
      wallet: wallet.wallet_address,
    }))
  );

  const chartData = allDataPoints.sort((a, b) => a.x.getTime() - b.x.getTime());

  // Group time series data by exchange
  const exchangeGroups = timeSeriesData.reduce((acc, series) => {
    const exchangeName = series.exchange_label || 'Unknown';
    if (!acc[exchangeName]) {
      acc[exchangeName] = [];
    }
    acc[exchangeName].push(series);
    return acc;
  }, {} as Record<string, WalletTimeSeries[]>);

  // Create separate datasets for each exchange
  const createExchangeDatasets = (exchangeSeries: WalletTimeSeries[], exchangeName: string) => {
    return exchangeSeries.map((series, index) => {
      const color = colors[index % colors.length];
      const label = `${series.wallet_address.slice(0, 8)}...${series.wallet_address.slice(-6)}`;
      
      return {
        label,
        data: series.data_points
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .map(point => ({
            x: new Date(point.timestamp),
            y: parseFloat(point.balance) / Math.pow(10, 18), // Convert from wei to ether
          })),
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      };
    });
  };

  // Chart options for the first chart (balance over time)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'white',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Wallet Balance Overview by Exchange',
        color: 'white',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleString();
          },
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(6)} ETH`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            minute: 'MMM dd HH:mm',
            hour: 'MMM dd HH:mm',
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy',
          },
        },
        ticks: {
          color: 'white',
          maxTicksLimit: 8,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        type: 'logarithmic' as const,
        ticks: {
          color: 'white',
          callback: (value: any) => `${value} ETH`,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  // Chart options for exchange-specific charts
  const createExchangeChartOptions = (exchangeName: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'white',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `${exchangeName} Exchange Wallet Balance Time Series`,
        color: 'white',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleString();
          },
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(6)} ETH`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            minute: 'MMM dd HH:mm',
            hour: 'MMM dd HH:mm',
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy',
          },
        },
        ticks: {
          color: 'white',
          maxTicksLimit: 8,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        type: 'logarithmic' as const,
        ticks: {
          color: 'white',
          callback: (value: any) => `${value} ETH`,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  });

  // Create dataset for the first chart
  const firstChartDataset = {
    label: 'All Balances',
    data: chartData,
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F620',
    borderWidth: 2,
    fill: false,
    tension: 0.1,
  };

  return (
    <div className="space-y-8">
      {/* Exchange Selector */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Exchange Filter</h3>
          <p className="text-gray-300 text-sm mb-4">
            Filter wallet balance data by exchange (leave unselected to view all)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedExchange('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedExchange === ''
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All Exchanges
          </button>
          {availableExchangesFromData.map((exchange) => (
            <button
              key={exchange}
              onClick={() => setSelectedExchange(exchange)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedExchange === exchange
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {exchange}
            </button>
          ))}
        </div>
      </div>

      {/* Exchange-specific Charts */}
      {Object.entries(exchangeGroups).map(([exchangeName, exchangeSeries]) => (
        <div key={exchangeName} className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">{exchangeName} Exchange</h3>
            <p className="text-gray-300 text-sm">
              Individual balance trends for wallets on {exchangeName}
            </p>
          </div>
          <div className="h-96">
            <Line 
              data={{ datasets: createExchangeDatasets(exchangeSeries, exchangeName) }} 
              options={createExchangeChartOptions(exchangeName)} 
            />
          </div>
        </div>
      ))}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h4 className="text-white font-semibold mb-2">Total Data Points</h4>
          <p className="text-2xl font-bold text-blue-400">{data.total_points}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h4 className="text-white font-semibold mb-2">Unique Wallets</h4>
          <p className="text-2xl font-bold text-green-400">
            {data.wallet_count}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h4 className="text-white font-semibold mb-2">Exchanges</h4>
          <p className="text-2xl font-bold text-purple-400">
            {new Set(data.wallet_time_series.map(wallet => wallet.exchange_label)).size}
          </p>
        </div>
      </div>
    </div>
  );
}; 