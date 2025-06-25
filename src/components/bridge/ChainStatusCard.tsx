// src/components/bridge/ChainStatusCard.tsx
'use client'

import React from 'react';
import { ExternalLink, Copy, Check, Wallet, Settings, Shield, Globe } from 'lucide-react';
import type { ChainData, ContractInfo } from '@/hooks/useBridgeData';

interface ChainStatusCardProps {
  chainData: ChainData;
}

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
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
      title={`Copy ${label || 'address'}`}
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
    </button>
  );
};

const AddressRow: React.FC<{ 
  label: string; 
  address: string; 
  explorerUrl: string; 
  icon: React.ReactNode;
}> = ({ label, address, explorerUrl, icon }) => (
  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/10">
    <div className="flex items-center space-x-3">
      <div className="p-1.5 rounded bg-white/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400 font-mono">
          {address.slice(0, 10)}...{address.slice(-8)}
        </p>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <CopyButton text={address} label={label} />
      <a
        href={`${explorerUrl}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 rounded hover:bg-white/10 transition-colors duration-200"
        title="View on explorer"
      >
        <ExternalLink size={14} className="text-blue-400" />
      </a>
    </div>
  </div>
);

const BalanceCard: React.FC<{ 
  title: string; 
  balance: number; 
  symbol: string; 
  icon: React.ReactNode;
  color: string;
}> = ({ title, balance, symbol, icon, color }) => (
  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg bg-gradient-to-r ${color}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-lg font-bold text-white">
        {balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}
      </p>
      <p className="text-sm text-gray-300">{title}</p>
    </div>
  </div>
);

export const ChainStatusCard: React.FC<ChainStatusCardProps> = ({ chainData }) => {
  const { name, explorerUrl, contracts } = chainData;

  const formatDomains = (domains: number[]) => {
    return domains.map(domain => `Domain ${domain}`).join(', ');
  };

  return (
    <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
            <Globe className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="text-sm text-gray-300">Bridge Contract Status</p>
          </div>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors duration-200 text-sm text-gray-300"
        >
          <span>Explorer</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Balances Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Wallet className="mr-2" size={16} />
          Token Balances
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(contracts).map(([key, contract]) => {
            if (contract.balance !== undefined) {
              return (
                <BalanceCard
                  key={`${key}-balance`}
                  title={`${key.replace(/([A-Z])/g, ' $1').trim()} Balance`}
                  balance={contract.balance}
                  symbol="EDGEN"
                  icon={<Wallet size={16} className="text-white" />}
                  color="from-green-500/20 to-emerald-500/20"
                />
              );
            }
            if (contract.nativeBalance !== undefined) {
              const symbol = name === 'Ethereum' ? 'ETH' : name === 'Binance Smart Chain' ? 'BNB' : 'EDGEN';
              return (
                <BalanceCard
                  key={`${key}-native`}
                  title="Native Balance"
                  balance={contract.nativeBalance}
                  symbol={symbol}
                  icon={<Wallet size={16} className="text-white" />}
                  color="from-blue-500/20 to-cyan-500/20"
                />
              );
            }
            if (contract.edgenBalance !== undefined) {
              return (
                <BalanceCard
                  key={`${key}-edgen`}
                  title="EDGEN Balance"
                  balance={contract.edgenBalance}
                  symbol="EDGEN"
                  icon={<Wallet size={16} className="text-white" />}
                  color="from-purple-500/20 to-pink-500/20"
                />
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Contract Addresses Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Settings className="mr-2" size={16} />
          Contract Addresses
        </h4>
        <div className="space-y-3">
          {Object.entries(contracts).map(([key, contract]) => (
            <AddressRow
              key={key}
              label={key.replace(/([A-Z])/g, ' $1').trim()}
              address={contract.address}
              explorerUrl={explorerUrl}
              icon={<Settings size={14} className="text-gray-400" />}
            />
          ))}
        </div>
      </div>

      {/* Contract Details Section */}
      {Object.entries(contracts).some(([_, contract]) => contract.hook || contract.owner || contract.domains) && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Shield className="mr-2" size={16} />
            Contract Details
          </h4>
          <div className="space-y-4">
            {Object.entries(contracts).map(([key, contract]) => {
              if (!contract.hook && !contract.owner && !contract.domains) return null;
              
              return (
                <div key={`${key}-details`} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h5 className="text-sm font-medium text-white mb-3">
                    {key.replace(/([A-Z])/g, ' $1').trim()} Details
                  </h5>
                  <div className="space-y-2">
                    {contract.hook && (
                      <AddressRow
                        label="Hook"
                        address={contract.hook}
                        explorerUrl={explorerUrl}
                        icon={<Settings size={12} className="text-gray-400" />}
                      />
                    )}
                    {contract.interchainSecurityModule && (
                      <AddressRow
                        label="Security Module"
                        address={contract.interchainSecurityModule}
                        explorerUrl={explorerUrl}
                        icon={<Shield size={12} className="text-gray-400" />}
                      />
                    )}
                    {contract.owner && (
                      <AddressRow
                        label="Owner"
                        address={contract.owner}
                        explorerUrl={explorerUrl}
                        icon={<Settings size={12} className="text-gray-400" />}
                      />
                    )}
                    {contract.domains && contract.domains.length > 0 && (
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 rounded bg-white/10">
                            <Globe size={12} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Destination Domains</p>
                            <p className="text-xs text-gray-400">{formatDomains(contract.domains)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};