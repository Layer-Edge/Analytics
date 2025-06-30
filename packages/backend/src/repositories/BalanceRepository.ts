import { db } from '../database/connection';
import { 
  BalanceSnapshot, 
  BalanceSnapshotWithDetails, 
  PaginationParams, 
  BalanceFilters, 
  PaginatedResponse,
  Network,
  Wallet
} from '../models/types';
import { logger } from '../utils/logger';

export class BalanceRepository {
  // Insert a new balance snapshot
  async createBalanceSnapshot(data: {
    wallet_id: number;
    network_id: number;
    balance: string;
    block_number?: number;
    timestamp?: Date;
  }): Promise<BalanceSnapshot> {
    const query = `
      INSERT INTO balance_snapshots (wallet_id, network_id, balance, block_number, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    const timestamp = data.timestamp || new Date();
    const result = await db.query(query, [
      data.wallet_id,
      data.network_id,
      data.balance,
      data.block_number,
      timestamp
    ]);
    
    return result.rows[0];
  }

  // Get balance snapshots with filters and pagination
  async getBalanceSnapshots(
    filters: BalanceFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<BalanceSnapshotWithDetails>> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause based on filters
    if (filters.wallet_addresses && filters.wallet_addresses.length > 0) {
      whereClause += ` AND w.address = ANY($${paramIndex})`;
      params.push(filters.wallet_addresses);
      paramIndex++;
    }

    if (filters.network_names && filters.network_names.length > 0) {
      whereClause += ` AND n.name = ANY($${paramIndex})`;
      params.push(filters.network_names);
      paramIndex++;
    }

    if (filters.start_date) {
      whereClause += ` AND bs.timestamp >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      whereClause += ` AND bs.timestamp <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM balance_snapshots bs
      JOIN wallets w ON bs.wallet_id = w.id
      JOIN networks n ON bs.network_id = n.id
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Main query with pagination
    const dataQuery = `
      SELECT 
        bs.*,
        w.address as wallet_address,
        w.label as wallet_label,
        n.name as network_name,
        n.symbol as network_symbol,
        n.is_native
      FROM balance_snapshots bs
      JOIN wallets w ON bs.wallet_id = w.id
      JOIN networks n ON bs.network_id = n.id
      ${whereClause}
      ORDER BY bs.timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pagination.limit, pagination.offset);
    const dataResult = await db.query(dataQuery, params);

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: dataResult.rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
  }

  // Get latest balance for each wallet-network combination
  async getLatestBalances(): Promise<BalanceSnapshotWithDetails[]> {
    const query = `
      SELECT DISTINCT ON (bs.wallet_id, bs.network_id)
        bs.*,
        w.address as wallet_address,
        w.label as wallet_label,
        n.name as network_name,
        n.symbol as network_symbol,
        n.is_native
      FROM balance_snapshots bs
      JOIN wallets w ON bs.wallet_id = w.id
      JOIN networks n ON bs.network_id = n.id
      WHERE w.is_active = true
      ORDER BY bs.wallet_id, bs.network_id, bs.timestamp DESC
    `;

    const result = await db.query(query);
    return result.rows;
  }

  // Get balance history for a specific wallet on a specific network
  async getBalanceHistory(
    walletAddress: string,
    networkName: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BalanceSnapshotWithDetails[]> {
    let whereClause = `
      WHERE w.address = $1 AND n.name = $2
    `;
    const params: any[] = [walletAddress, networkName];
    let paramIndex = 3;

    if (startDate) {
      whereClause += ` AND bs.timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND bs.timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const query = `
      SELECT 
        bs.*,
        w.address as wallet_address,
        w.label as wallet_label,
        n.name as network_name,
        n.symbol as network_symbol,
        n.is_native
      FROM balance_snapshots bs
      JOIN wallets w ON bs.wallet_id = w.id
      JOIN networks n ON bs.network_id = n.id
      ${whereClause}
      ORDER BY bs.timestamp ASC
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  // Clean up old balance snapshots (keep only last 30 days)
  async cleanupOldSnapshots(daysToKeep: number = 30): Promise<number> {
    const query = `
      DELETE FROM balance_snapshots 
      WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
    `;

    const result = await db.query(query);
    logger.info(`Cleaned up ${result.rowCount} old balance snapshots`);
    return result.rowCount || 0;
  }
}

export class NetworkRepository {
  async getAllNetworks(): Promise<Network[]> {
    const query = 'SELECT * FROM networks ORDER BY name';
    const result = await db.query(query);
    return result.rows;
  }

  async getNetworkByName(name: string): Promise<Network | null> {
    const query = 'SELECT * FROM networks WHERE name = $1';
    const result = await db.query(query, [name]);
    return result.rows[0] || null;
  }


}

export class WalletRepository {
  async getAllWallets(): Promise<Wallet[]> {
    const query = 'SELECT * FROM wallets WHERE is_active = true ORDER BY address';
    const result = await db.query(query);
    return result.rows;
  }

  async getWalletByAddress(address: string): Promise<Wallet | null> {
    const query = 'SELECT * FROM wallets WHERE address = $1';
    const result = await db.query(query, [address]);
    return result.rows[0] || null;
  }

  async createWallet(address: string, label?: string): Promise<Wallet> {
    const query = `
      INSERT INTO wallets (address, label)
      VALUES ($1, $2)
      ON CONFLICT (address) DO UPDATE SET
        label = EXCLUDED.label,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await db.query(query, [address, label]);
    return result.rows[0];
  }

  async deactivateWallet(address: string): Promise<void> {
    const query = 'UPDATE wallets SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE address = $1';
    await db.query(query, [address]);
  }
} 