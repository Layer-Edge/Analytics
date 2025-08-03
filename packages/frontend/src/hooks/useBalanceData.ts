import { useQuery } from '@tanstack/react-query';

// New types based on the actual API response
interface BalanceTimeSeriesItem {
  id: string;
  timestamp: string;
  balance: string;
  block_number: string;
  created_at: string;
  period_start: string;
  period_end: string;
  period_index: string;
  total_hours: string;
  first_timestamp: string;
  last_timestamp: string;
  expected_periods: number;
  wallet_address: string;
  wallet_label: string | null;
  network_name: string;
  network_symbol: string;
  is_native: boolean;
  wallet_id: number;
  network_id: number;
  exchange_label: string | null;
}

interface WalletTimeSeries {
  wallet_address: string;
  exchange_label: string;
  data_points: BalanceTimeSeriesItem[];
  count: number;
}

interface BalanceDataResponse {
  success: boolean;
  wallet_time_series: WalletTimeSeries[];
  total_points: number;
  wallet_count: number;
  max_points_per_wallet: number;
  network_name: string;
  requested_wallets: string[];
}

interface UseBalanceDataParams {
  page?: number;
  limit?: number;
  networkNames?: string;
}

const fetchBalanceData = async (params: UseBalanceDataParams = {}): Promise<BalanceDataResponse> => {
  const { page = 1, limit = 100, networkNames = 'ETH' } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    network_names: networkNames,
  });

  const response = await fetch(`/api/balance-data?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch balance data');
  }
  return response.json();
};

export const useBalanceData = (params: UseBalanceDataParams = {}) => {
  return useQuery({
    queryKey: ['balanceData', params],
    queryFn: () => fetchBalanceData(params),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Export types for use in components
export type { BalanceTimeSeriesItem, BalanceDataResponse, UseBalanceDataParams, WalletTimeSeries }; 