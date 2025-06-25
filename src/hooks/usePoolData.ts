import { useQuery } from '@tanstack/react-query';

export interface PoolData {
  pool: {
    token0: {
      name: string;
      symbol: string;
      totalSupply: string;
      totalValueLockedUSD: string;
      txCount: string;
    };
    token1: {
      name: string;
      symbol: string;
      totalSupply: string;
      totalValueLockedUSD: string;
      txCount: string;
    };
    volumeUSD: string;
    volumeToken0: string;
    volumeToken1: string;
    collectedFeesToken0: string;
    collectedFeesToken1: string;
    untrackedVolumeUSD: string;
    poolDayData: Array<{
      id: string;
      tvlUSD: string;
      volumeUSD: string;
    }>;
    liquidityProviderCount: string;
    feeTier: string;
    feesUSD: string;
    collectedFeesUSD: string;
    token0Price: string;
    token1Price: string;
  };
}

// Query function to fetch pool data
const fetchPoolData = async (poolId: string, dex: 'uniswap' | 'pancakeswap'): Promise<PoolData> => {
  const response = await fetch(`/api/pool-data?poolId=${poolId}&dex=${dex}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  return result;
};

export function usePoolData(poolId: string, dex: 'uniswap' | 'pancakeswap') {
  return useQuery({
    queryKey: ['pool-data', poolId, dex],
    queryFn: () => fetchPoolData(poolId, dex),
    enabled: !!poolId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
} 