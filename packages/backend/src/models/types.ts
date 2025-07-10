export interface Network {
  id: number;
  name: string;
  chain_id: number;
  token_address?: string;
  is_native: boolean;
  symbol: string;
  created_at: Date;
  updated_at: Date;
}

export interface Wallet {
  id: number;
  address: string;
  label?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BalanceSnapshot {
  id: string;
  wallet_id: number;
  network_id: number;
  balance: string; // Using string to handle large numbers precisely
  block_number?: number;
  timestamp: Date;
  created_at: Date;
}

export interface BalanceSnapshotWithDetails extends BalanceSnapshot {
  wallet_address: string;
  wallet_label?: string;
  network_name: string;
  network_symbol: string;
  is_native: boolean;
}

// New interface for time-series balance data
export interface BalanceTimeSeriesItem {
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
}

export interface BalanceTimeSeriesResponse {
  success: boolean;
  data: BalanceTimeSeriesItem[];
  count: number;
  max_points_requested: number;
  filters: {
    network_names: string[];
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface BalanceFilters {
  wallet_addresses?: string[];
  network_names?: string[];
  start_date?: Date;
  end_date?: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Time bucket types for periodic sampling
export interface PeriodicSampleFilters {
  wallet_addresses?: string[];
  network_names?: string[];
  since_date?: Date; // Optional: only consider data after this date
}

export interface PeriodicBalanceSnapshot extends BalanceSnapshotWithDetails {
  period_start: Date;
  period_end: Date;
  period_index: number;
  total_hours: number;
  first_timestamp: Date;
  last_timestamp: Date;
  expected_periods: number;
} 
