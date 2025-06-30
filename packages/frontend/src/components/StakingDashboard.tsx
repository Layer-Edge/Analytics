'use client'

import React from 'react';
import { Coins, TrendingUp, DollarSign, Users, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { useStakingData, formatBigInt, formatAPY, formatAddress } from '../hooks/useStakingData';

const MetricCard: React.FC<{
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  loading?: boolean;
}> = ({ title, value, change, icon, trend, loading = false }) => {
  const [displayValue, setDisplayValue] = React.useState('0');
  
  React.useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setDisplayValue(value), 300);
      return () => clearTimeout(timer);
    }
  }, [value, loading]);

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
            {icon}
          </div>
        </div>
        <div>
          <div className="h-8 bg-white/10 rounded mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

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
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingUp size={12} />}
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

const StakingCard: React.FC<{ 
  globalStats: any; 
  tierStats: any[]; 
  loading?: boolean; 
}> = ({ globalStats, tierStats, loading = false }) => {
  const totalStaked = globalStats ? formatBigInt(globalStats.totalStaked) : '0';
  const minStakeAmount = globalStats ? formatBigInt(globalStats.minStakeAmount) : '0';
  
  // Find the highest APY from tier stats
  const highestAPY = tierStats.length > 0 
    ? Math.max(...tierStats.map(tier => parseFloat(formatBigInt(tier.currentAPY))))
    : 0;

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 bg-white/10 rounded mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
            <Coins className="text-yellow-400" size={24} />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="h-4 bg-white/10 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Total Staked EDGEN</h3>
          <p className="text-sm text-gray-300">Current staking balance</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
          <Coins className="text-yellow-400" size={24} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-300">Staked Amount</span>
          <span className="text-white font-medium">{totalStaked} EDGEN</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Max APY</span>
          <span className="text-white font-medium">{highestAPY.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Min Stake</span>
          <span className="text-white font-medium">{minStakeAmount} EDGEN</span>
        </div>
      </div>
    </div>
  );
};

const TopStakersCard: React.FC<{ stakers: any[]; loading?: boolean }> = ({ stakers, loading = false }) => {
  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 bg-white/10 rounded mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <Users className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="h-4 bg-white/10 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Top Stakers</h3>
          <p className="text-sm text-gray-300">Highest staked amounts</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          <Users className="text-blue-400" size={24} />
        </div>
      </div>
      <div className="space-y-3">
        {stakers.slice(0, 5).map((staker, index) => (
          <div key={staker.id} className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">#{index + 1}</span>
              <span className="text-sm text-white font-medium">{formatAddress(staker.id)}</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-white font-medium">{formatBigInt(staker.totalStaked)} EDGEN</div>
              <div className="text-xs text-gray-400">Tier {staker.currentTier}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StakingDashboard: React.FC = () => {
  const { globalStats, tierStats, topStakers, loading, error, refetch } = useStakingData();

  const totalStaked = globalStats ? formatBigInt(globalStats.totalStaked) : '0';
  const totalStakers = globalStats?.totalStakerCount || 0;
  const totalPendingRewards = globalStats ? globalStats.totalPendingRewards : '0';
  const rewardsReserve = globalStats ? formatBigInt(globalStats.rewardsReserve) : '0';

  // Calculate average APY from tier stats
  const averageAPY = tierStats.length > 0 
    ? tierStats.reduce((sum, tier) => sum + parseFloat(formatBigInt(tier.currentAPY)), 0) / tierStats.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                <Coins className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold text-white">Staking Analytics Dashboard</h1>
            </div>
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`text-white ${loading ? 'animate-spin' : ''}`} size={16} />
              <span className="text-white text-sm">Refresh</span>
            </button>
          </div>
          <p className="text-gray-300">Track your staking performance and rewards</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center space-x-2">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-400">Error: {error}</span>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Staked"
            value={`${totalStaked} EDGEN`}
            change="+0.00%"
            trend="up"
            icon={<Coins className="text-yellow-400" size={24} />}
            loading={loading}
          />
          <MetricCard
            title="Total Stakers"
            value={totalStakers.toString()}
            icon={<Users className="text-teal-400" size={24} />}
            loading={loading}
          />
          <MetricCard
            title="Pending Rewards"
            value={`${totalPendingRewards} EDGEN`}
            icon={<DollarSign className="text-purple-400" size={24} />}
            loading={loading}
          />
        </div>

        {/* Staking Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StakingCard 
            globalStats={globalStats} 
            tierStats={tierStats} 
            loading={loading} 
          />
          <TopStakersCard 
            stakers={topStakers} 
            loading={loading} 
          />
        </div>

        {/* Tier Statistics */}
        {tierStats.length > 0 && (
          <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 mb-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <Activity className="mr-2" size={20} />
              Tier Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tierStats.map((tier) => (
                <div key={tier.id} className="text-center p-4 rounded-xl bg-white/5">
                  <div className={`p-3 rounded-xl mx-auto w-fit mb-3 ${
                    tier.tier === 1 ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' :
                    tier.tier === 2 ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' :
                    'bg-gradient-to-r from-yellow-500/20 to-orange-500/20'
                  }`}>
                    <span className={`text-lg font-bold ${
                      tier.tier === 1 ? 'text-green-400' :
                      tier.tier === 2 ? 'text-blue-400' :
                      'text-yellow-400'
                    }`}>T{tier.tier}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1">APY: {formatAPY(tier.currentAPY)}</p>
                  <p className="text-sm text-gray-300 mb-1">Stakers: {tier.stakerCount}</p>
                  <p className="text-sm text-gray-300">Staked: {formatBigInt(tier.totalStaked)} EDGEN</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
            <Activity className="mr-2" size={20} />
            Platform Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 mx-auto w-fit mb-3">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <p className="text-sm text-gray-300">Rewards Reserve</p>
              <p className="text-white font-medium">{rewardsReserve} EDGEN</p>
            </div>
            <div className="text-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 mx-auto w-fit mb-3">
                <DollarSign className="text-purple-400" size={24} />
              </div>
              <p className="text-sm text-gray-300">Last Updated</p>
              <p className="text-white font-medium">
                {globalStats ? `Block ${globalStats.lastUpdated}` : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 mx-auto w-fit mb-3">
                <Users className="text-blue-400" size={24} />
              </div>
              <p className="text-sm text-gray-300">Active Stakers</p>
              <p className="text-white font-medium">{topStakers.filter(s => s.isActive).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 