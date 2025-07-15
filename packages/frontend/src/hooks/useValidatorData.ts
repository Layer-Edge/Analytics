import { useQuery } from '@tanstack/react-query';

export interface ValidatorStakingInfo {
  operator_address: string;
  consensus_pubkey: {
    '@type': string;
    key: string;
  };
  jailed: boolean;
  status: string;
  tokens: string;
  delegator_shares: string;
  description: {
    moniker: string;
    identity: string;
    website: string;
    security_contact: string;
    details: string;
  };
  commission: {
    commission_rates: {
      rate: string;
      max_rate: string;
      max_change_rate: string;
    };
    update_time: string;
  };
  min_self_delegation: string;
  unbonding_height: string;
  unbonding_time: string;
}

export interface ValidatorRewards {
  commission: {
    commission: Array<{
      denom: string;
      amount: string;
    }>;
  };
  outstanding_rewards: {
    rewards: Array<{
      denom: string;
      amount: string;
    }>;
  };
}

export interface ValidatorDelegations {
  count: number;
  total_amount: string;
  delegations: Array<{
    delegation: {
      delegator_address: string;
      validator_address: string;
      shares: string;
    };
    balance: {
      denom: string;
      amount: string;
    };
  }>;
}

export interface ValidatorSummary {
  is_jailed: boolean;
  status: string;
  total_staking_amount: string;
  self_staking_amount: string;
  commission_rate: string;
  has_commission_rewards: boolean;
  has_outstanding_rewards: boolean;
}

export interface Validator {
  evm_address: string;
  validator_address: string;
  staking_info: ValidatorStakingInfo;
  rewards: ValidatorRewards;
  delegations: ValidatorDelegations;
  summary: ValidatorSummary;
}

export interface ValidatorData {
  validators: Validator[];
  totalValidators: number;
  successfulFetches: number;
  timestamp: string;
}

export interface UseValidatorDataReturn {
  validators: Validator[];
  totalValidators: number;
  successfulFetches: number;
  timestamp: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Query function
const fetchValidatorData = async (): Promise<ValidatorData> => {
  const response = await fetch('/api/validators');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const useValidatorData = (): UseValidatorDataReturn => {
  const query = useQuery({
    queryKey: ['validators'],
    queryFn: fetchValidatorData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    validators: query.data?.validators || [],
    totalValidators: query.data?.totalValidators || 0,
    successfulFetches: query.data?.successfulFetches || 0,
    timestamp: query.data?.timestamp || '',
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch
  };
};

// Utility functions for formatting validator data
export const formatValidatorTokens = (tokens: string): string => {
  try {
    const num = BigInt(tokens);
    const divisor = BigInt(10 ** 18); // aedgen has 18 decimals
    const whole = num / divisor;
    const fraction = num % divisor;
    
    if (fraction === BigInt(0)) {
      return whole.toString();
    }
    
    const fractionStr = fraction.toString().padStart(18, '0');
    const trimmedFraction = fractionStr.slice(0, 2);
    
    return `${whole}.${trimmedFraction}`;
  } catch {
    return '0';
  }
};

export const formatCommissionRate = (rate: string): string => {
  try {
    const num = parseFloat(rate) * 100;
    return `${num.toFixed(2)}%`;
  } catch {
    return '0.00%';
  }
};

export const formatValidatorAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getValidatorStatusColor = (status: string): string => {
  switch (status) {
    case 'BOND_STATUS_BONDED':
      return 'text-green-400';
    case 'BOND_STATUS_UNBONDING':
      return 'text-yellow-400';
    case 'BOND_STATUS_UNBONDED':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

export const getValidatorStatusText = (status: string): string => {
  switch (status) {
    case 'BOND_STATUS_BONDED':
      return 'Active';
    case 'BOND_STATUS_UNBONDING':
      return 'Unbonding';
    case 'BOND_STATUS_UNBONDED':
      return 'Inactive';
    default:
      return 'Unknown';
  }
}; 