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
