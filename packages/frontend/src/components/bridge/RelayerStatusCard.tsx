'use client'

import React from 'react';
import { Wallet, Copy, Check, TrendingUp, TrendingDown } from 'lucide-react';
import type { BridgeContractsData } from '@/hooks/useBridgeData';
import Image from 'next/image';

interface RelayerStatusCardProps {
  address: string;
  balances: {
    ethereum: number;
    binance: number;
    edgenchain: number;
  };
  fees: {
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

export const RelayerStatusCard: React.FC<RelayerStatusCardProps> = ({ address, balances, fees }) => {
  return (
    <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm">
            <Wallet className="text-green-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Relayer Gas Status</h3>
            <p className="text-sm text-gray-300">Native token balances (gas left)</p>
          </div>
        </div>
      </div>

      {/* Relayer Address */}
      <div className="mb-6">
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
          <div>
            <p className="text-sm font-medium text-white">Relayer Address</p>
            <p className="text-xs text-gray-400 font-mono">
              {address.slice(0, 20)}...{address.slice(-5)}
            </p>
          </div>
          <CopyButton text={address} />
        </div>
      </div>

      {/* Chain Native Balances */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Chain Gas Balances</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600">
                <Image src="/ethereum-eth-logo.png" alt="Ethereum Logo" width={24} height={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Ethereum</p>
                <p className="text-xs text-gray-400">{balances.ethereum.toFixed(6)} ETH</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600">
                <Image src="/binance-icon.png" alt="Binance Logo" width={24} height={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Binance Smart Chain</p>
                <p className="text-xs text-gray-400">{balances.binance.toFixed(6)} BNB</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600">
                <Image src="/logo-e.png" alt="EdgeChain Logo" width={24} height={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">EdgeChain</p>
                <p className="text-xs text-gray-400">{balances.edgenchain.toFixed(6)} EDGEN</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Collected Section */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-white mb-4">Fee collected</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600">
                <Image src="/ethereum-eth-logo.png" alt="Ethereum Logo" width={24} height={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Ethereum</p>
                <p className="text-xs text-gray-400">{fees.ethereum.toFixed(6)} ETH</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600">
                <Image src="/binance-icon.png" alt="Binance Logo" width={24} height={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Binance Smart Chain</p>
                <p className="text-xs text-gray-400">{fees.binance.toFixed(6)} BNB</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600">
                <Image src="/logo-e.png" alt="EdgeChain Logo" width={24} height={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">EdgeChain</p>
                <p className="text-xs text-gray-400">{fees.edgenchain.toFixed(6)} EDGEN</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};