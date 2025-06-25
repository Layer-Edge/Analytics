// src/components/BridgeDashboard.tsx
'use client'

import React from 'react';
import { GitBranch, Activity, BarChart3, RefreshCw, AlertTriangle } from 'lucide-react';
import { useBridgeAnalytics } from '@/hooks/useBridgeData';
import { ChainStatusCard } from './bridge/ChainStatusCard';
import { RelayerStatusCard } from './bridge/RelayerStatusCard';
import { WorkflowStatusCard } from './bridge/WorkflowStatusCard';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const ErrorMessage: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-64 space-y-4">
    <div className="text-center">
      <AlertTriangle className="text-red-400 mx-auto mb-2" size={48} />
      <p className="text-red-400 mb-2">Error loading bridge data</p>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
    <button
      onClick={onRetry}
      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors duration-200 text-blue-400"
    >
      <RefreshCw size={16} />
      <span>Retry</span>
    </button>
  </div>
);

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-r ${color} backdrop-blur-sm`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-300">{title}</p>
    </div>
  </div>
);

export const BridgeDashboard: React.FC = () => {
  const { contracts, status, isLoading, isError, error, refetch } = useBridgeAnalytics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="relative z-10 p-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
                <GitBranch className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold text-white">Bridge Analytics Dashboard</h1>
            </div>
            <p className="text-gray-300">Cross-chain bridge performance and transaction analytics</p>
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (isError || !contracts.data || !status.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="relative z-10 p-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
                <GitBranch className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold text-white">Bridge Analytics Dashboard</h1>
            </div>
            <p className="text-gray-300">Cross-chain bridge performance and transaction analytics</p>
          </div>
          <ErrorMessage 
            message={error?.message || 'Failed to load bridge data'} 
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }

  const { chains = [], relayer } = contracts.data;
  const statusData = status.data;

  // Calculate summary metrics
  const totalChains = chains.length;
  const totalContracts = chains.reduce((sum, chain) => sum + Object.keys(chain.contracts).length, 0);
  const totalBalance = chains.reduce((sum, chain) => {
    return sum + Object.values(chain.contracts).reduce((chainSum, contract) => {
      return chainSum + (contract.balance || 0) + (contract.nativeBalance || 0) + (contract.edgenBalance || 0);
    }, 0);
  }, 0);

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
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
                <GitBranch className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Bridge Analytics Dashboard</h1>
                <p className="text-gray-300">Cross-chain bridge performance and transaction analytics</p>
              </div>
            </div>
            <button
              onClick={refetch}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors duration-200 text-white"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Active Chains"
            value={totalChains.toString()}
            icon={<GitBranch className="text-blue-400" size={24} />}
            color="from-blue-500/20 to-cyan-500/20"
          />
          <MetricCard
            title="Total Contracts"
            value={totalContracts.toString()}
            icon={<Activity className="text-green-400" size={24} />}
            color="from-green-500/20 to-emerald-500/20"
          />
          <MetricCard
            title="Success Rate"
            value={`${statusData.workflows.successRate}%`}
            icon={<BarChart3 className="text-purple-400" size={24} />}
            color="from-purple-500/20 to-pink-500/20"
          />
          <MetricCard
            title="Bridge Status"
            value={statusData.overall.status}
            icon={<Activity className="text-yellow-400" size={24} />}
            color="from-yellow-500/20 to-orange-500/20"
          />
        </div>

        {/* Bridge Status and Relayer Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <WorkflowStatusCard statusData={statusData} />
          <RelayerStatusCard address={relayer.address} balances={relayer.balances} />
        </div>

        {/* Chain Status Cards */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              <GitBranch className="text-blue-400" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">Chain Contract Status</h2>
          </div>
          
          {chains.map((chainData) => (
            <ChainStatusCard key={chainData.chain} chainData={chainData} />
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              Bridge Version {statusData.overall.version} • 
              Uptime: {statusData.overall.uptime}%
            </span>
            <span>
              Last updated: {new Date(statusData.overall.lastUpdated).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};