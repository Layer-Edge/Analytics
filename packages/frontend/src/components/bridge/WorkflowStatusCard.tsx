'use client'

import React from 'react';
import { Activity, CheckCircle, XCircle, Clock, ExternalLink, TrendingUp, AlertTriangle, Copy, Check } from 'lucide-react';
import type { WorkflowStatus, BridgeStatusData } from '@/hooks/useBridgeData';

interface WorkflowStatusCardProps {
  statusData: BridgeStatusData;
}

const StatusBadge: React.FC<{ status: 'healthy' | 'degraded' | 'down' }> = ({ status }) => {
  const config = {
    healthy: { color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
    degraded: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: AlertTriangle },
    down: { color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle }
  };

  const { color, bg, icon: Icon } = config[status];

  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${bg}`}>
      <Icon size={16} className={color} />
      <span className={`text-sm font-medium ${color} capitalize`}>{status}</span>
    </div>
  );
};

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
      className="p-1 rounded hover:bg-white/10 transition-colors duration-200 ml-1"
      title={`Copy ${label || 'Workflow ID'}`}
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
    </button>
  );
};

const WorkflowItem: React.FC<{ workflow: WorkflowStatus }> = ({ workflow }) => {
  const statusConfig = {
    completed: { color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
    failed: { color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
    pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock }
  };

  const { color, bg, icon: Icon } = statusConfig[workflow.status];

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200">
      <div className="flex items-center space-x-3">
        <div className={`p-1.5 rounded ${bg}`}>
          <Icon size={14} className={color} />
        </div>
        <div>
          <p className="text-sm font-medium text-white flex items-center">
            Workflow ID: <span className="font-mono text-xs text-gray-300 ml-1">{workflow.id.slice(0, 8)}...</span>
            <CopyButton text={workflow.id} label="Workflow ID" />
          </p>
          <p className="text-xs text-gray-400">
            Amount: {workflow.totalAmountFormatted} • Transfers: {workflow.transferCount} • Step: {workflow.currentStep}
          </p>
          <p className="text-xs text-gray-400">
            Created: {new Date(workflow.createdAt).toLocaleString()} | Completed: {workflow.completedAt ? new Date(workflow.completedAt).toLocaleString() : 'N/A'}
          </p>
          {workflow.errorMessage && workflow.status === 'failed' && (
            <p className="text-xs text-red-400 mt-1">Error: {workflow.errorMessage}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end space-y-1">
        <span className={`text-xs font-medium ${color} capitalize`}>{workflow.status}</span>
        <span className="text-xs text-gray-400">Retries: {workflow.retryCount}</span>
      </div>
    </div>
  );
};

export const WorkflowStatusCard: React.FC<WorkflowStatusCardProps> = ({ statusData }) => {
  const { overall, workflows } = statusData;
  const [activeTab, setActiveTab] = React.useState<'completed' | 'failed'>('completed');

  return (
    <div className="glass-card p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
            <Activity className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Bridge Status</h3>
            <p className="text-sm text-gray-300">Real-time bridge operations</p>
          </div>
        </div>
        <StatusBadge status={overall.status} />
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-300">Uptime</p>
            <TrendingUp size={16} className="text-green-400" />
          </div>
          <p className="text-xl font-bold text-white">{overall.uptime}%</p>
        </div>
        
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-300">Success Rate</p>
            <CheckCircle size={16} className="text-green-400" />
          </div>
          <p className="text-xl font-bold text-white">{workflows.successRate}%</p>
        </div>
        
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-300">Total Workflows</p>
            <Activity size={16} className="text-blue-400" />
          </div>
          <p className="text-xl font-bold text-white">{workflows.totalCount}</p>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 p-1 rounded-lg bg-white/5">
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors duration-200 ${
              activeTab === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Completed ({workflows.completed.length})
          </button>
          <button
            onClick={() => setActiveTab('failed')}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors duration-200 ${
              activeTab === 'failed'
                ? 'bg-red-500/20 text-red-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Failed ({workflows.failed.length})
          </button>
        </div>
      </div>

      {/* Workflow List */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4 capitalize">
          {activeTab} Workflows
        </h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {workflows[activeTab].slice(0, 10).map((workflow) => (
            <WorkflowItem key={workflow.id} workflow={workflow} />
          ))}
          {workflows[activeTab].length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No {activeTab} workflows found</p>
            </div>
          )}
        </div>
      </div>

      {/* Version Info */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Version {overall.version}</span>
          <span>Last updated: {new Date(overall.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};