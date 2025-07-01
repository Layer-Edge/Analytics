'use client'

import React, { useState } from 'react';
import { TrendingUp, DollarSign, Users, Activity, BarChart3, PieChart, TrendingDown, ChevronDown } from 'lucide-react';
import { usePoolData } from '@/hooks/usePoolData';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';

// Sample data for PancakeSwap (chartData1)
const chartData1 = {
  "data": {
    "pool": {
      "allocPoint": "0",
      "block": "50804930",
      "masterChef": {
        "id": "0x556b9306565093c855aea9ae92a594704c2cd59e",
        "poolCount": "339"
      },
      "timestamp": "1748951291",
      "totalUsersCount": "0",
      "userPositions": [],
      "v3Pool": "0x32fff96e79a7e984a02f5abab073e4cc17ab9fe3"
    }
  }
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}> = ({ title, value, change, icon, trend }) => {
  const [displayValue, setDisplayValue] = React.useState('0');
  
  React.useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
            trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-1 transition-all duration-500">{displayValue}</p>
        <p className="text-sm text-gray-300">{title}</p>
      </div>
    </div>
  );
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

const LineChart: React.FC<{ data: any[]; dataKey: string; title: string; color: string }> = ({ 
  data, dataKey, title, color 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  // Prepare Chart.js data
  const chartData = {
    labels: data.map((item) => item.id?.split('-')[1] || ''),
    datasets: [
      {
        label: title,
        data: data.map((item) => parseFloat(item[dataKey])),
        borderColor: color,
        backgroundColor: color + '33', // 20% opacity
        pointBackgroundColor: color,
        pointBorderColor: color,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Chart.js options
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        color: '#fff',
        font: { size: 18, weight: 700 },
        padding: { bottom: 20 },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#222',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: color,
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `${title}: $${context.parsed.y.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Day',
          color: '#ccc',
          font: { size: 14, weight: 700 },
        },
        ticks: {
          color: '#aaa',
        },
        grid: {
          color: 'rgba(255,255,255,0.05)',
        },
      },
      y: {
        title: {
          display: true,
          text: dataKey === 'tvlUSD' ? 'TVL (USD)' : 'Volume (USD)',
          color: '#ccc',
          font: { size: 14, weight: 700 },
        },
        ticks: {
          color: '#aaa',
          callback: (tickValue: string | number) => `$${Number(tickValue).toLocaleString()}`,
        },
        grid: {
          color: 'rgba(255,255,255,0.05)',
        },
      },
    },
  };

  return (
    <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
      <Line data={chartData} options={options} height={250} />
    </div>
  );
};

const TokenCard: React.FC<{ token: any; price: string }> = ({ token, price }) => {
  return (
    <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{token.symbol}</h3>
          <p className="text-sm text-gray-300">{token.name}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500/20 to-blue-500/20">
          <Activity className="text-teal-400" size={24} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-300">Price</span>
          <span className="text-white font-medium">${parseFloat(price).toFixed(6)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">TVL USD</span>
          <span className="text-white font-medium">
            ${parseFloat(token.totalValueLockedUSD).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">TX Count</span>
          <span className="text-white font-medium">{parseInt(token.txCount).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <p className="text-red-400 mb-2">Error loading data</p>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  </div>
);

export const DEXDashboard: React.FC = () => {
  const [selectedDEX, setSelectedDEX] = useState<'uniswap' | 'pancakeswap'>('uniswap');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Use the pool ID from the original data
  const poolId = "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e";
  const { data: poolData, isLoading, error, refetch } = usePoolData(poolId, selectedDEX);
  
  const formatNumber = (num: string | number) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="relative z-10 p-6 max-w-7xl mx-auto">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !poolData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="relative z-10 p-6 max-w-7xl mx-auto">
          <ErrorMessage message={error?.message || 'No data available'} />
        </div>
      </div>
    );
  }

  const pool = poolData.pool;
  const poolBasics = chartData1.data.pool;
  
  const totalTVL = pool.poolDayData.reduce((sum, day) => sum + parseFloat(day.tvlUSD), 0) / pool.poolDayData.length;
  const totalVolume = pool.poolDayData.reduce((sum, day) => sum + parseFloat(day.volumeUSD), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <BarChart3 className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold text-white">DEX Analytics Dashboard</h1>
            </div>
            
            {/* DEX Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/15 transition-all duration-200"
              >
                <span className="capitalize">{selectedDEX}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-lg z-50">
                  <button
                    onClick={() => {
                      setSelectedDEX('uniswap');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors duration-200 ${
                      selectedDEX === 'uniswap' ? 'text-blue-400' : 'text-gray-300'
                    }`}
                  >
                    Uniswap
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDEX('pancakeswap');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors duration-200 ${
                      selectedDEX === 'pancakeswap' ? 'text-blue-400' : 'text-gray-300'
                    }`}
                  >
                    PancakeSwap
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-300">Real-time insights into your liquidity pool performance on {selectedDEX}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Average TVL"
            value={formatNumber(totalTVL)}
            change="+12.5%"
            trend="up"
            icon={<DollarSign className="text-blue-400" size={24} />}
          />
          <MetricCard
            title="Total Volume"
            value={formatNumber(totalVolume)}
            change="+8.2%"
            trend="up"
            icon={<TrendingUp className="text-green-400" size={24} />}
          />
          <MetricCard
            title="Total Fees"
            value={formatNumber(pool.feesUSD)}
            change="-2.1%"
            trend="down"
            icon={<PieChart className="text-purple-400" size={24} />}
          />
          <MetricCard
            title="Pool Count"
            value={poolBasics.masterChef.poolCount}
            icon={<Users className="text-teal-400" size={24} />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <LineChart
            data={pool.poolDayData}
            dataKey="tvlUSD"
            title="Total Value Locked (TVL) Over Time"
            color="#3b82f6"
          />
          <LineChart
            data={pool.poolDayData}
            dataKey="volumeUSD"
            title="Volume Over Time"
            color="#10b981"
          />
        </div>

        {/* Token Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TokenCard token={pool.token0} price={pool.token0Price} />
          <TokenCard token={pool.token1} price={pool.token1Price} />
        </div>

        {/* Pool Statistics */}
        <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
            <Activity className="mr-2" size={20} />
            Pool Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-1">
                {parseFloat(pool.feeTier) / 10000}%
              </p>
              <p className="text-sm text-gray-300">Fee Tier</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-1">
                {formatNumber(pool.untrackedVolumeUSD)}
              </p>
              <p className="text-sm text-gray-300">Untracked Volume</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-1">
                {pool.liquidityProviderCount}
              </p>
              <p className="text-sm text-gray-300">LP Count</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 