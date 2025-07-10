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
import { useBalanceData, type BalanceTimeSeriesItem } from '../hooks/useBalanceData';

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

// Available networks
const availableNetworks = ['ETH', 'BSC', 'EDGEN'];

export const BalanceDashboard: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('ETH');
  
  const { data, isLoading, error } = useBalanceData({
    networkNames: selectedNetwork,
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

  // Group data by wallet address and network to create time series
  const groupedData = data.data.reduce((acc, item) => {
    const key = `${item.wallet_address}-${item.network_name}`;
    if (!acc[key]) {
      acc[key] = {
        wallet_address: item.wallet_address,
        wallet_label: item.wallet_label,
        network_name: item.network_name,
        network_symbol: item.network_symbol,
        is_native: item.is_native,
        data_points: []
      };
    }
    acc[key].data_points.push({
      timestamp: item.timestamp,
      balance: item.balance,
      block_number: item.block_number
    });
    return acc;
  }, {} as Record<string, {
    wallet_address: string;
    wallet_label: string | null;
    network_name: string;
    network_symbol: string;
    is_native: boolean;
    data_points: Array<{
      timestamp: string;
      balance: string;
      block_number: string;
    }>;
  }>);

  // Convert grouped data to array
  const timeSeriesData = Object.values(groupedData);

  // Prepare chart data for the overview chart (balance over time)
  const chartData = data.data
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(item => ({
      x: new Date(item.timestamp),
      y: parseFloat(item.balance) / Math.pow(10, 18), // Convert from wei to ether
      label: `${item.wallet_address.slice(0, 8)}...${item.wallet_address.slice(-6)} - ${item.network_name}`,
      network: item.network_name,
      wallet: item.wallet_address,
    }));

  // Group time series data by network
  const networkGroups = timeSeriesData.reduce((acc, series) => {
    const networkName = series.network_name;
    if (!acc[networkName]) {
      acc[networkName] = [];
    }
    acc[networkName].push(series);
    return acc;
  }, {} as Record<string, typeof timeSeriesData>);

  // Create separate datasets for each network
  const createNetworkDatasets = (networkSeries: typeof timeSeriesData, networkName: string) => {
    return networkSeries.map((series, index) => {
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
        text: 'Balance Overview',
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
          unit: 'minute' as const,
          displayFormats: {
            minute: 'HH:mm',
          },
        },
        ticks: {
          color: 'white',
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

  // Chart options for network-specific charts
  const createNetworkChartOptions = (networkName: string) => ({
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
        text: `${networkName} Wallet Balance Time Series`,
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
          unit: 'minute' as const,
          displayFormats: {
            minute: 'HH:mm',
          },
        },
        ticks: {
          color: 'white',
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
      {/* Network Selector */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Network Selection</h3>
          <p className="text-gray-300 text-sm mb-4">
            Select a network to view balance data for specific chains
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableNetworks.map((network) => (
            <button
              key={network}
              onClick={() => setSelectedNetwork(network)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedNetwork === network
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {network}
            </button>
          ))}
        </div>
      </div>

      {/* Network-specific Charts */}
      {Object.entries(networkGroups).map(([networkName, networkSeries]) => (
        <div key={networkName} className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">{networkName} Network</h3>
            <p className="text-gray-300 text-sm">
              Individual balance trends for wallets on the {networkName} network
            </p>
          </div>
          <div className="h-96">
            <Line 
              data={{ datasets: createNetworkDatasets(networkSeries, networkName) }} 
              options={createNetworkChartOptions(networkName)} 
            />
          </div>
        </div>
      ))}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h4 className="text-white font-semibold mb-2">Total Data Points</h4>
          <p className="text-2xl font-bold text-blue-400">{data.data.length}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h4 className="text-white font-semibold mb-2">Unique Wallets</h4>
          <p className="text-2xl font-bold text-green-400">
            {new Set(data.data.map(item => item.wallet_address)).size}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h4 className="text-white font-semibold mb-2">Networks</h4>
          <p className="text-2xl font-bold text-purple-400">
            {new Set(data.data.map(item => item.network_name)).size}
          </p>
        </div>
      </div>
    </div>
  );
}; 