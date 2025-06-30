-- Database schema for balance monitoring

-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Networks table
CREATE TABLE IF NOT EXISTS networks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    chain_id INTEGER NOT NULL UNIQUE,
    token_address VARCHAR(42), -- NULL for native tokens
    is_native BOOLEAN NOT NULL DEFAULT FALSE,
    symbol VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL UNIQUE,
    label VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Balance snapshots table
CREATE TABLE IF NOT EXISTS balance_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    network_id INTEGER NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    balance TEXT NOT NULL,
    block_number BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_wallet_network ON balance_snapshots(wallet_id, network_id);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_timestamp ON balance_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_network_timestamp ON balance_snapshots(network_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_wallet_timestamp ON balance_snapshots(wallet_id, timestamp);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_composite ON balance_snapshots(wallet_id, network_id, timestamp DESC);

-- Insert default networks
INSERT INTO networks (name, chain_id, token_address, is_native, symbol) VALUES
    ('ETH', 1, '0xAa9806c938836627Ed1a41Ae871c7E1889AE02Ca', FALSE, 'ERC20'),
    ('BSC', 56, '0x0C808F0464C423d5Ea4F4454fcc23B6E2Ae75562', FALSE, 'ERC20'),
    ('EDGEN', 4207, NULL, TRUE, 'EDGEN')
ON CONFLICT (chain_id) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at (drop if exists, then create)
DROP TRIGGER IF EXISTS update_networks_updated_at ON networks;
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;

CREATE TRIGGER update_networks_updated_at BEFORE UPDATE ON networks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
