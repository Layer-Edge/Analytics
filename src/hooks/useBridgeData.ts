// src/hooks/useBridgeData.ts
import { useQuery } from '@tanstack/react-query';

// Types
export interface WorkflowStatus {
  id: string;
  status: 'completed' | 'failed' | 'pending';
  totalAmount: string;
  transferCount: number;
  currentStep: number;
  createdAt: string;
  startedAt: string;
  completedAt: string;
  errorMessage?: string | null;
  retryCount: number;
  lastRetryAt?: string | null;
  updatedAt: string;
  totalAmountFormatted: string;
}

export interface BridgeStatusData {
  overall: {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    lastUpdated: string;
    version: string;
  };
  workflows: {
    completed: WorkflowStatus[];
    failed: WorkflowStatus[];
    pending: WorkflowStatus[];
    totalCount: number;
    successRate: number;
  };
}

export interface ContractInfo {
  address: string;
  balance?: number;
  hook?: string;
  interchainSecurityModule?: string;
  owner?: string;
  domains?: number[];
  nativeBalance?: number;
  edgenBalance?: number;
}

export interface ChainData {
  chain: string;
  name: string;
  explorerUrl: string;
  contracts: {
    [key: string]: ContractInfo;
  };
}

export interface BridgeContractsData {
  chains: ChainData[];
  relayer: {
    address: string;
    balances: {
      ethereum: number;
      binance: number;
      edgenchain: number;
    };
  };
}

// Bridge Contracts Hook
export function useBridgeContracts() {
  return useQuery({
    queryKey: ['bridge-contracts'],
    queryFn: async (): Promise<BridgeContractsData> => {
      const response = await fetch('/api/bridge-contracts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Specific Chain Data Hook
export function useChainContracts(chain: string) {
  return useQuery({
    queryKey: ['bridge-contracts', chain],
    queryFn: async (): Promise<ChainData> => {
      const response = await fetch(`/api/bridge-contracts?chain=${chain}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    },
    enabled: !!chain,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

// Bridge Status Hook
export function useBridgeStatus() {
  return useQuery({
    queryKey: ['bridge-status'],
    queryFn: async (): Promise<BridgeStatusData> => {
      const response = await fetch('/api/bridge-status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60, // Refetch every minute
    retry: 3,
  });
}

// Specific Workflow Status Hook
export function useWorkflowStatus(status: 'completed' | 'failed') {
  return useQuery({
    queryKey: ['bridge-workflows', status],
    queryFn: async (): Promise<{ workflows: WorkflowStatus[]; count: number }> => {
      const response = await fetch(`/api/bridge-status?status=${status}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    },
    enabled: !!status,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 120, // Refetch every 2 minutes
  });
}

// Combined Bridge Analytics Hook
export function useBridgeAnalytics() {
  const contractsQuery = useBridgeContracts();
  const statusQuery = useBridgeStatus();
  
  return {
    contracts: contractsQuery,
    status: statusQuery,
    isLoading: contractsQuery.isLoading || statusQuery.isLoading,
    isError: contractsQuery.isError || statusQuery.isError,
    error: contractsQuery.error || statusQuery.error,
    refetch: () => {
      contractsQuery.refetch();
      statusQuery.refetch();
    }
  };
}