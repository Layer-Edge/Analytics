'use client'

import React from 'react';
import { Wallet, Copy, Check, TrendingUp, TrendingDown } from 'lucide-react';
import type { BridgeContractsData } from '@/hooks/useBridgeData';

interface RelayerStatusCardProps {
  address: string;
  balances: {
    ethereum: number;
    binance: number;
    edgenchain: number;
  };
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 transition-colors duration-200"
      title="Copy address"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
    </button>
  );
};

export const RelayerStatusCard: React.FC<RelayerStatusCardProps> = ({ address, balances }) => {
  const totalValue = balances.ethereum * 3500 + balances.binance * 320 + balances.edgenchain * 0.1; // Mock prices

  return (
    <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm">
            <Wallet className="text-green-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Relayer Status</h3>
            <p className="text-sm text-gray-300">Cross-chain relayer balances</p>
          </div>
        </div>
      </div>

      {/* Relayer Address */}
      <div className="mb-6">
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
          <div>
            <p className="text-sm font-medium text-white">Relayer Address</p>
            <p className="text-xs text-gray-400 font-mono">
              {address.slice(0, 20)}...{address.slice(-20)}
            </p>
          </div>
          <CopyButton text={address} />
        </div>
      </div>

      {/* Total Value */}
      <div className="mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Total Value</p>
              <p className="text-2xl font-bold text-white">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="flex items-center space-x-1 text-green-400">
              <TrendingUp size={16} />
              <span className="text-sm font-medium">+2.4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chain Balances */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Chain Balances</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">ETH</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Ethereum</p>
                <p className="text-xs text-gray-400">{balances.ethereum.toFixed(4)} ETH</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">${(balances.ethereum * 3500).toLocaleString()}</p>
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp size={12} />
                <span className="text-xs">+1.2%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">BNB</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Binance Smart Chain</p>
                <p className="text-xs text-gray-400">{balances.binance.toFixed(4)} BNB</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">${(balances.binance * 320).toLocaleString()}</p>
              <div className="flex items-center space-x-1 text-red-400">
                <TrendingDown size={12} />
                <span className="text-xs">-0.8%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">EDG</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">EdgeChain</p>
                <p className="text-xs text-gray-400">{balances.edgenchain.toLocaleString()} EDGEN</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">${(balances.edgenchain * 0.1).toLocaleString()}</p>
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp size={12} />
                <span className="text-xs">+5.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};