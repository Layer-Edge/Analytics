import { useQuery } from '@tanstack/react-query';
import { 
  fetchStakingGlobalStats, 
  fetchTierStats, 
  fetchTopStakers,
  StakingGlobalStats,
  TierStats,
  Staker
} from '../utils/graphql';

export interface ContractStakingData {
  totalStaked: string;
  stakerCountInTree: string;
  stakerCountOutOfTree: string;
  rewardsReserve: string;
  minStakeAmount: string;
  tier1Count: string;
  tier2Count: string;
  tier3Count: string;
  totalStakersCount: string;
  topStakers: Array<{
    id: string;
    totalStaked: string;
    currentTier: number;
    pendingRewards: string;
    apy: string;
    rank: number;
    isActive: boolean;
  }>;
}

export interface UseStakingDataReturn {
  globalStats: StakingGlobalStats | null;
  tierStats: TierStats[];
  topStakers: Staker[];
  contractData: ContractStakingData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Query functions
const fetchStakingContractData = async (): Promise<ContractStakingData> => {
  const response = await fetch('/api/staking-contract');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.contract;
};

const fetchStakingGlobalStatsData = async (): Promise<StakingGlobalStats | null> => {
  const result = await fetchStakingGlobalStats();
  return result.stakingGlobalStats.nodes[0] || null;
};

const fetchTierStatsData = async (): Promise<TierStats[]> => {
  const result = await fetchTierStats();
  return result.tierStats.nodes;
};

const fetchTopStakersData = async (): Promise<Staker[]> => {
  const result = await fetchTopStakers(10);
  return result.stakers.nodes.map((staker: Staker) => ({
    ...staker,
    id: staker.id.split('-')[1],
  }));
};

export const useStakingData = (): UseStakingDataReturn => {
  // Query for contract data
  const contractQuery = useQuery({
    queryKey: ['staking-contract'],
    queryFn: fetchStakingContractData,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query for global stats
  const globalStatsQuery = useQuery({
    queryKey: ['staking-global-stats'],
    queryFn: fetchStakingGlobalStatsData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query for tier stats
  const tierStatsQuery = useQuery({
    queryKey: ['staking-tier-stats'],
    queryFn: fetchTierStatsData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query for top stakers
  const topStakersQuery = useQuery({
    queryKey: ['staking-top-stakers'],
    queryFn: fetchTopStakersData,
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Combined loading state
  const loading = contractQuery.isLoading || globalStatsQuery.isLoading || tierStatsQuery.isLoading || topStakersQuery.isLoading;

  // Combined error state
  const error = contractQuery.error || globalStatsQuery.error || tierStatsQuery.error || topStakersQuery.error;
  const errorMessage = error instanceof Error ? error.message : 'Failed to fetch staking data';

  // Combined refetch function
  const refetch = () => {
    contractQuery.refetch();
    globalStatsQuery.refetch();
    tierStatsQuery.refetch();
    topStakersQuery.refetch();
  };

  return {
    globalStats: globalStatsQuery.data || null,
    tierStats: tierStatsQuery.data || [],
    topStakers: topStakersQuery.data || [],
    contractData: contractQuery.data || null,
    loading,
    error: error ? errorMessage : null,
    refetch
  };
};

// Utility functions for formatting data
export const formatBigInt = (value: string, decimals: number = 18): string => {
  try {
    const num = BigInt(value);
    const divisor = BigInt(10 ** decimals);
    const whole = num / divisor;
    const fraction = num % divisor;
    
    if (fraction === BigInt(0)) {
      return whole.toString();
    }
    
    const fractionStr = fraction.toString().padStart(decimals, '0');
    // Keep only 2 decimal places
    const trimmedFraction = fractionStr.slice(0, 2);
    
    return `${whole}.${trimmedFraction}`;
  } catch {
    return '0';
  }
};

export const formatAPY = (apyValue: string): string => {
  try {
    return `${apyValue}%`;
  } catch {
    return '0.00%';
  }
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}; 