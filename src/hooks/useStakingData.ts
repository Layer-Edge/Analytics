import { useState, useEffect } from 'react';
import { 
  fetchStakingGlobalStats, 
  fetchTierStats, 
  fetchTopStakers,
  StakingGlobalStats,
  TierStats,
  Staker
} from '../utils/graphql';

export interface UseStakingDataReturn {
  globalStats: StakingGlobalStats | null;
  tierStats: TierStats[];
  topStakers: Staker[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useStakingData = (): UseStakingDataReturn => {
  const [globalStats, setGlobalStats] = useState<StakingGlobalStats | null>(null);
  const [tierStats, setTierStats] = useState<TierStats[]>([]);
  const [topStakers, setTopStakers] = useState<Staker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [globalStatsResult, tierStatsResult, topStakersResult] = await Promise.all([
        fetchStakingGlobalStats(),
        fetchTierStats(),
        fetchTopStakers(10)
      ]);

      // Set global stats (take the first one if multiple networks)
      setGlobalStats(globalStatsResult.stakingGlobalStats.nodes[0] || null);
      setTierStats(tierStatsResult.tierStats.nodes);
      setTopStakers(topStakersResult.stakers.nodes);
    } catch (err) {
      console.error('Error fetching staking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch staking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    globalStats,
    tierStats,
    topStakers,
    loading,
    error,
    refetch: fetchData
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