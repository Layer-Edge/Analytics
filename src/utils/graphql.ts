export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export async function graphqlQuery<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const url = process.env.NEXT_PUBLIC_UNISWAP_SUBGRAPH_URL;
  
  if (!url) {
    throw new Error('GraphQL endpoint URL not configured');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL query failed:', error);
    throw error;
  }
}

// Pool data interface
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

// Query to fetch pool data
export const POOL_QUERY = `
  query GetPoolData($poolId: ID!) {
    pool(id: $poolId) {
      token0 {
        name
        symbol
        totalSupply
        totalValueLockedUSD
        txCount
      }
      token1 {
        name
        symbol
        totalSupply
        totalValueLockedUSD
        txCount
      }
      volumeUSD
      volumeToken0
      volumeToken1
      collectedFeesToken0
      collectedFeesToken1
      untrackedVolumeUSD
      poolDayData {
        id
        tvlUSD
        volumeUSD
      }
      liquidityProviderCount
      feeTier
      feesUSD
      collectedFeesUSD
      token0Price
      token1Price
    }
  }
`;

export async function fetchPoolData(poolId: string): Promise<PoolData> {
  return graphqlQuery<PoolData>(POOL_QUERY, { poolId });
} 