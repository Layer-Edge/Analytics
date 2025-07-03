-- Additional indexes for time bucket optimization
-- Run this script to add performance indexes for time bucket queries

-- Primary lookup indexes for reference tables
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON wallets(is_active);
CREATE INDEX IF NOT EXISTS idx_networks_name ON networks(name);
CREATE INDEX IF NOT EXISTS idx_networks_chain_id ON networks(chain_id);

-- Covering index for latest balance queries (DISTINCT ON optimization)
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_latest_covering 
ON balance_snapshots(wallet_id, network_id, timestamp DESC) 
INCLUDE (balance, block_number, created_at);

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_created_at ON balance_snapshots(created_at);

-- Index for block number queries (if you query by block)
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_block_number ON balance_snapshots(block_number) 
WHERE block_number IS NOT NULL;

-- Partial index for active wallets only (performance optimization)
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_active_wallets 
ON balance_snapshots(wallet_id, network_id, timestamp DESC) 
WHERE wallet_id IN (SELECT id FROM wallets WHERE is_active = true);

-- Specialized index for time bucket queries (balance ordering)
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_balance_numeric 
ON balance_snapshots(wallet_id, network_id, (balance::numeric), timestamp);

-- Index for time range queries with balance ordering
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_time_balance 
ON balance_snapshots(timestamp, wallet_id, network_id, (balance::numeric));

-- Display index information
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('balance_snapshots', 'wallets', 'networks')
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC; 