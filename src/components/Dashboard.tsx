'use client'

import React, { useState } from 'react';
import { BarChart3, GitBranch } from 'lucide-react';
import { Tabs } from './Tabs';
import { DEXDashboard } from './DEXDashboard';
import { BridgeDashboard } from './BridgeDashboard';

const tabs = [
  {
    id: 'dex',
    label: 'DEX Analytics',
    icon: <BarChart3 size={16} />
  },
  {
    id: 'bridge',
    label: 'Bridge Analytics',
    icon: <GitBranch size={16} />
  }
];

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dex');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dex':
        return <DEXDashboard />;
      case 'bridge':
        return <BridgeDashboard />;
      default:
        return <DEXDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Main Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <BarChart3 className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-white">LayerEdge Analytics</h1>
          </div>
          <p className="text-gray-300">Comprehensive analytics for decentralized exchanges and cross-chain bridges</p>
        </div>

        {/* Tabs */}
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Tab Content */}
        {renderActiveTab()}
      </div>
    </div>
  );
};