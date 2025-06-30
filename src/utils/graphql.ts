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
	variables?: Record<string, any>,
	endpoint?: string
): Promise<T> {
	const url = endpoint || process.env.NEXT_PUBLIC_UNISWAP_SUBGRAPH_URL;

	if (!url) {
		throw new Error("GraphQL endpoint URL not configured");
	}

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
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
			console.error("GraphQL errors:", result.errors);
			throw new Error(
				`GraphQL errors: ${result.errors
					.map((e) => e.message)
					.join(", ")}`
			);
		}

		return result.data;
	} catch (error) {
		console.error("GraphQL query failed:", error);
		throw error;
	}
}

// Staking data interfaces
export interface StakingGlobalStats {
	nodeId: string;
	id: string;
	network: string;
	totalStaked: string;
	totalStakerCount: number;
	tier1Count: number;
	tier2Count: number;
	tier3Count: number;
	totalPendingRewards: string;
	rewardsReserve: string;
	minStakeAmount: string;
	lastUpdated: string;
}

export interface TierStats {
	nodeId: string;
	id: string;
	tier: number;
	network: string;
	currentAPY: string;
	totalStaked: string;
	stakerCount: number;
	minRank: number;
	maxRank: number;
	lastUpdated: string;
}

export interface Staker {
	nodeId: string;
	id: string;
	network: string;
	totalStaked: string;
	currentTier: number;
	depositTimestamp: string;
	lastUpdateBlock: string;
	lastInterestUpdateTime: string;
	pendingRewards: string;
	claimedRewards: string;
	compoundedRewards: string;
	isActive: boolean;
	rank: number;
	tierRank: number;
}

export interface StakingData {
	stakingGlobalStats: StakingGlobalStats[];
	tierStats: TierStats[];
	stakers: Staker[];
}

// Staking queries
export const STAKING_GLOBAL_STATS_QUERY = `
  query GetStakingGlobalStats {
    stakingGlobalStats {
      nodes {
        nodeId
        id
        network
        totalStaked
        totalStakerCount
        tier1Count
        tier2Count
        tier3Count
        totalPendingRewards
        rewardsReserve
        minStakeAmount
        lastUpdated
      }
    }
  }
`;

export const TIER_STATS_QUERY = `
  query GetTierStats {
    tierStats(orderBy: TIER_ASC) {
      nodes {
        nodeId
        id
        tier
        network
        currentAPY
        totalStaked
        stakerCount
        minRank
        maxRank
        lastUpdated
      }
    }
  }
`;

export const TOP_STAKERS_QUERY = `
  query GetTopStakers($limit: Int!) {
    stakers(
    filter: {isActive: {equalTo: true}}
    orderBy: TOTAL_STAKED_DESC
    first: $limit
  ) {
    nodes {
      nodeId
      id
      network
      totalStaked
      currentTier
      pendingRewards
      claimedRewards
      isActive
      rank
      tierRank
    }
  }
  }
`;

export async function fetchStakingGlobalStats(): Promise<{
	stakingGlobalStats: { nodes: StakingGlobalStats[] };
}> {
	return graphqlQuery<{
		stakingGlobalStats: { nodes: StakingGlobalStats[] };
	}>(
		STAKING_GLOBAL_STATS_QUERY,
		{},
		"https://indexer2.explorer.layeredge.io/"
	);
}

export async function fetchTierStats(): Promise<{
	tierStats: { nodes: TierStats[] };
}> {
	return graphqlQuery<{ tierStats: { nodes: TierStats[] } }>(
		TIER_STATS_QUERY,
		{},
		"https://indexer2.explorer.layeredge.io/"
	);
}

export async function fetchTopStakers(
	limit: number = 10
): Promise<{ stakers: { nodes: Staker[] } }> {
	return graphqlQuery<{ stakers: { nodes: Staker[] } }>(
		TOP_STAKERS_QUERY,
		{ limit },
		"https://indexer2.explorer.layeredge.io/"
	);
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
