import { db } from '../database/connection';
import { 
  BalanceSnapshot, 
  BalanceSnapshotWithDetails, 
  PaginationParams, 
  BalanceFilters, 
  PaginatedResponse,
  Network,
  Wallet,
  PeriodicSampleFilters,
  PeriodicBalanceSnapshot
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

  // Bulk insert balance snapshots for better performance
  async createBalanceSnapshotsBulk(snapshots: Array<{
    wallet_id: number;
    network_id: number;
    balance: string;
    block_number?: number;
    timestamp?: Date;
  }>): Promise<void> {
    if (snapshots.length === 0) return;
    
    // Use PostgreSQL's UNNEST for efficient bulk insert
    const query = `
      INSERT INTO balance_snapshots (wallet_id, network_id, balance, block_number, timestamp)
      SELECT * FROM UNNEST(
        $1::integer[],
        $2::integer[],
        $3::text[],
        $4::bigint[],
        $5::timestamp[]
      )
    `;
    
    const defaultTimestamp = new Date();
    const walletIds = snapshots.map(s => s.wallet_id);
    const networkIds = snapshots.map(s => s.network_id);
    const balances = snapshots.map(s => s.balance);
    const blockNumbers = snapshots.map(s => s.block_number || 0);
    const timestamps = snapshots.map(s => s.timestamp || defaultTimestamp);
    
    await db.query(query, [walletIds, networkIds, balances, blockNumbers, timestamps]);
    
    logger.info(`Bulk inserted ${snapshots.length} balance snapshots`);
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

  // Get periodic samples using actual data timespan
  async getPeriodicBalanceSnapshotsFromActualData(
    intervalHours: number,
    position: 'first' | 'last' = 'last',
    filters: PeriodicSampleFilters = {}
  ): Promise<PeriodicBalanceSnapshot[]> {
    let whereClause = 'WHERE w.is_active = true';
    let bucketWhereClause = 'WHERE w.is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    // Add filters for data timespan calculation
    if (filters.since_date) {
      whereClause += ` AND bs.timestamp >= $${paramIndex}`;
      bucketWhereClause += ` AND bs.timestamp >= $${paramIndex}`;
      params.push(filters.since_date);
      paramIndex++;
    }

    if (filters.wallet_addresses && filters.wallet_addresses.length > 0) {
      whereClause += ` AND w.address = ANY($${paramIndex})`;
      bucketWhereClause += ` AND w.address = ANY($${paramIndex})`;
      params.push(filters.wallet_addresses);
      paramIndex++;
    }

    if (filters.network_names && filters.network_names.length > 0) {
      whereClause += ` AND n.name = ANY($${paramIndex})`;
      bucketWhereClause += ` AND n.name = ANY($${paramIndex})`;
      params.push(filters.network_names);
      paramIndex++;
    }

    const orderDirection = position === 'last' ? 'DESC' : 'ASC';

    const query = `
      WITH data_timespan AS (
        -- Calculate actual time range from the data
        SELECT 
          MIN(bs.timestamp) as first_timestamp,
          MAX(bs.timestamp) as last_timestamp,
          EXTRACT(EPOCH FROM (MAX(bs.timestamp) - MIN(bs.timestamp))) / 3600 as total_hours
        FROM balance_snapshots bs
        JOIN wallets w ON bs.wallet_id = w.id
        JOIN networks n ON bs.network_id = n.id
        ${whereClause}
      ),
      time_buckets AS (
        -- Generate time buckets based on actual data timespan
        SELECT 
          bucket_start,
          bucket_start + INTERVAL '${intervalHours} hours' as bucket_end,
          ROW_NUMBER() OVER (ORDER BY bucket_start) - 1 as period_index,
          dt.total_hours,
          dt.first_timestamp,
          dt.last_timestamp,
          CEIL(dt.total_hours / ${intervalHours}) as expected_periods
        FROM data_timespan dt,
        LATERAL generate_series(
          DATE_TRUNC('hour', dt.first_timestamp),
          DATE_TRUNC('hour', dt.last_timestamp),
          INTERVAL '${intervalHours} hours'
        ) as bucket_start
      ),
      latest_in_bucket AS (
        -- For each bucket, find the latest snapshot
        SELECT DISTINCT ON (tb.period_index, bs.wallet_id, bs.network_id)
          bs.*,
          tb.bucket_start as period_start,
          tb.bucket_end as period_end,
          tb.period_index,
          tb.total_hours,
          tb.first_timestamp,
          tb.last_timestamp,
          tb.expected_periods
        FROM time_buckets tb
        JOIN balance_snapshots bs ON bs.timestamp >= tb.bucket_start 
                                  AND bs.timestamp < tb.bucket_end
        JOIN wallets w ON bs.wallet_id = w.id
        JOIN networks n ON bs.network_id = n.id
        ${bucketWhereClause}
        ORDER BY tb.period_index, bs.wallet_id, bs.network_id, bs.timestamp ${orderDirection}
      )
      SELECT 
        lib.id,
        lib.timestamp,
        lib.balance,
        lib.block_number,
        lib.created_at,
        lib.period_start,
        lib.period_end,
        lib.period_index,
        ROUND(lib.total_hours::NUMERIC, 2) as total_hours,
        lib.first_timestamp,
        lib.last_timestamp,
        lib.expected_periods::INTEGER,
        w.address as wallet_address,
        w.label as wallet_label,
        n.name as network_name,
        n.symbol as network_symbol,
        n.is_native,
        lib.wallet_id,
        lib.network_id
      FROM latest_in_bucket lib
      JOIN wallets w ON lib.wallet_id = w.id
      JOIN networks n ON lib.network_id = n.id
      ORDER BY lib.period_start DESC, w.address, n.name
    `;

    try {
      const result = await db.query(query, params);
      logger.info(`Periodic balance query returned ${result.rows.length} samples`);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching periodic balance snapshots:', error);
      throw error;
    }
  }

  // Get time series data optimized for charts
  async getTimeSeriesData(
    filters: PeriodicSampleFilters,
    maxPoints: number = 100
  ): Promise<PeriodicBalanceSnapshot[]> {
    try {
      // Calculate optimal interval based on data range
      let whereClause = 'WHERE w.is_active = true';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.since_date) {
        whereClause += ` AND bs.timestamp >= $${paramIndex}`;
        params.push(filters.since_date);
        paramIndex++;
      }

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

      // Get time bounds to calculate optimal interval
      const boundsQuery = `
        SELECT 
          MIN(bs.timestamp) as min_time,
          MAX(bs.timestamp) as max_time,
          EXTRACT(EPOCH FROM (MAX(bs.timestamp) - MIN(bs.timestamp))) / 3600 as total_hours
        FROM balance_snapshots bs
        JOIN wallets w ON bs.wallet_id = w.id
        JOIN networks n ON bs.network_id = n.id
        ${whereClause}
      `;

      const boundsResult = await db.query(boundsQuery, params);
      const bounds = boundsResult.rows[0];

      if (!bounds.min_time || !bounds.max_time || bounds.total_hours <= 0) {
        logger.info('No data found for time series query');
        return [];
      }

      // Calculate optimal interval hours to get approximately maxPoints
      const intervalHours = Math.max(1, Math.ceil(bounds.total_hours / maxPoints));

      logger.info(`Time series: ${bounds.total_hours}h span, ${intervalHours}h intervals, targeting ${maxPoints} points`);

      // Use the periodic samples method with calculated interval
      return await this.getPeriodicBalanceSnapshotsFromActualData(intervalHours, 'last', filters);

    } catch (error) {
      logger.error('Error fetching time series data:', error);
      throw error;
    }
  }

  // Get exactly max_points per wallet with first, last, and random middle selection
  async getWalletTimeSeriesData(
    walletAddress: string,
    maxPoints: number = 100,
    filters?: PeriodicSampleFilters
  ): Promise<PeriodicBalanceSnapshot[]> {
    try {
      let whereClause = 'WHERE w.is_active = true AND w.address = $1';
      const params: any[] = [walletAddress];
      let paramIndex = 2;

      if (filters?.since_date) {
        whereClause += ` AND bs.timestamp >= $${paramIndex}`;
        params.push(filters.since_date);
        paramIndex++;
      }

      if (filters?.network_names && filters.network_names.length > 0) {
        whereClause += ` AND n.name = ANY($${paramIndex})`;
        params.push(filters.network_names);
        paramIndex++;
      }

      // If maxPoints is 1, just get the latest record
      if (maxPoints === 1) {
        const query = `
          SELECT 
            bs.timestamp,
            bs.balance,
            bs.block_number,
            w.address as wallet_address,
            w.label as wallet_label,
            n.name as network_name,
            n.symbol as network_symbol,
            n.is_native as is_native
          FROM balance_snapshots bs
          JOIN wallets w ON bs.wallet_id = w.id
          JOIN networks n ON bs.network_id = n.id
          ${whereClause}
          ORDER BY bs.timestamp DESC
          LIMIT 1
        `;
        
        const result = await db.query(query, params);
        return result.rows;
      }

      // If maxPoints is 2, get first and last
      if (maxPoints === 2) {
        const query = `
          (
            SELECT 
              bs.timestamp,
              bs.balance,
              bs.block_number,
              w.address as wallet_address,
              w.label as wallet_label,
              n.name as network_name,
              n.symbol as network_symbol,
              n.is_native as is_native
            FROM balance_snapshots bs
            JOIN wallets w ON bs.wallet_id = w.id
            JOIN networks n ON bs.network_id = n.id
            ${whereClause}
            ORDER BY bs.timestamp ASC
            LIMIT 1
          )
          UNION ALL
          (
            SELECT 
              bs.timestamp,
              bs.balance,
              bs.block_number,
              w.address as wallet_address,
              w.label as wallet_label,
              n.name as network_name,
              n.symbol as network_symbol,
              n.is_native as is_native
            FROM balance_snapshots bs
            JOIN wallets w ON bs.wallet_id = w.id
            JOIN networks n ON bs.network_id = n.id
            ${whereClause}
            ORDER BY bs.timestamp DESC
            LIMIT 1
          )
          ORDER BY timestamp ASC
        `;
        
        const result = await db.query(query, params);
        return result.rows;
      }

      // For maxPoints > 2, get first, last, and random middle selection
      const query = `
        WITH wallet_data AS (
          SELECT 
            bs.timestamp,
            bs.balance,
            bs.block_number,
            w.address as wallet_address,
            w.label as wallet_label,
            n.name as network_name,
            n.symbol as network_symbol,
            n.is_native as is_native,
            ROW_NUMBER() OVER (ORDER BY bs.timestamp ASC) as row_num,
            COUNT(*) OVER () as total_rows
          FROM balance_snapshots bs
          JOIN wallets w ON bs.wallet_id = w.id
          JOIN networks n ON bs.network_id = n.id
          ${whereClause}
        ),
        first_record AS (
          SELECT * FROM wallet_data WHERE row_num = 1
        ),
        last_record AS (
          SELECT * FROM wallet_data WHERE row_num = total_rows
        ),
        middle_records AS (
          SELECT * FROM wallet_data 
          WHERE row_num > 1 AND row_num < total_rows
          ORDER BY RANDOM()
          LIMIT $${paramIndex}
        )
        SELECT 
          timestamp,
          balance,
          block_number,
          wallet_address,
          wallet_label,
          network_name,
          network_symbol,
          is_native
        FROM (
          SELECT * FROM first_record
          UNION ALL
          SELECT * FROM last_record
          UNION ALL
          SELECT * FROM middle_records
        ) combined
        ORDER BY timestamp ASC
      `;

      params.push(maxPoints - 2); // Random middle records count
      const result = await db.query(query, params);
      return result.rows;

    } catch (error) {
      logger.error(`Error fetching wallet time series data for ${walletAddress}:`, error);
      throw error;
    }
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
 