import { useQuery } from '@tanstack/react-query';

interface DataPoint {
  timestamp: string;
  balance: string;
  block_number: string;
}

interface TimeSeriesItem {
  wallet_address: string;
  wallet_label: string | null;
  network_name: string;
  network_symbol: string;
  is_native: boolean;
  data_points: DataPoint[];
}

interface ChartDataItem {
  timestamp: string;
  balance: string;
  wallet_address: string;
  wallet_label: string | null;
  network_name: string;
  network_symbol: string;
  is_native: boolean;
  block_number: string;
}

interface BalanceDataResponse {
  success: boolean;
  chart_data: ChartDataItem[];
  time_series: TimeSeriesItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    network_names?: string[];
  };
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