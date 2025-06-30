# Analytics Backend - Balance Monitoring Service

A comprehensive backend service for monitoring ERC20 token balances across multiple blockchain networks (Ethereum, BSC, and Edgeless Network).

## Features

- 🔍 **Multi-Network Balance Monitoring**: Tracks balances across ETH, BSC, and EDGEN networks
- 📊 **PostgreSQL Storage**: Robust database schema for historical balance data
- ⏰ **Scheduled Monitoring**: Configurable cron-based balance checks (default: every minute)
- 🚀 **RESTful API**: Comprehensive endpoints with filtering and pagination
- 📈 **Chart-Ready Data**: Endpoints optimized for frontend chart integration
- 🏥 **Health Monitoring**: Built-in health checks and monitoring endpoints
- 🔧 **Admin Interface**: Start/stop monitoring, manual triggers, cleanup utilities

## Architecture

```
├── src/
│   ├── config/           # Network and wallet configurations
│   ├── database/         # Database connection and schema
│   ├── models/           # TypeScript interfaces
│   ├── repositories/     # Database operations
│   ├── services/         # Business logic and blockchain interaction
│   ├── routes/           # API endpoints
│   ├── utils/            # Utilities and logging
│   └── index.ts          # Main server file
```

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- RPC endpoints for ETH, BSC, and EDGEN networks

## Setup Instructions

### 1. Environment Configuration

Copy the environment template:
```bash
cp src/config/env.example .env
```

Configure your `.env` file:
```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=analytics_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# RPC URLs
ETH_RPC_URL=https://mainnet.infura.io/v3/your-api-key
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
EDGEN_RPC_URL=https://rpc.edgeless.network/http

# Token Addresses (Optional - defaults provided)
ETH_TOKEN_ADDRESS=0xa0b86a33e6776ce441c44e5c05f711f49c72cac5
BSC_TOKEN_ADDRESS=0xe9e7cea3dedca5984780bafc599bd69add087d56

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 2. Database Setup

Create PostgreSQL database:
```sql
CREATE DATABASE analytics_db;
```

Run the schema:
```bash
psql -d analytics_db -f src/database/schema.sql
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Configure Wallets and Networks

Edit `src/config/networks.ts` to customize:
- Monitored wallet addresses
- Token contract addresses
- Network configurations

### 5. Start the Service

Development mode:
```bash
pnpm dev
```

Production mode:
```bash
pnpm build
pnpm start
```

## API Endpoints

### Balance Data Endpoints

#### GET `/api/balances`
Get balance snapshots with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `wallet_addresses` (string[]): Filter by wallet addresses
- `network_names` (string[]): Filter by network names
- `start_date` (ISO string): Filter from date
- `end_date` (ISO string): Filter to date

**Example:**
```bash
GET /api/balances?page=1&limit=50&network_names=ETH&start_date=2024-01-01T00:00:00Z
```

#### GET `/api/balances/latest`
Get the latest balance for each wallet-network combination.

#### GET `/api/balances/history/:wallet_address/:network_name`
Get balance history for a specific wallet on a specific network.

**Query Parameters:**
- `start_date` (ISO string): Optional start date
- `end_date` (ISO string): Optional end date

#### GET `/api/balances/summary`
Get balance summary statistics grouped by network and wallet.

#### GET `/api/balances/chart-data`
Get data formatted for chart visualization with time series grouping.

#### GET `/api/balances/networks`
Get all available networks.

#### GET `/api/balances/wallets`
Get all monitored wallets.


## Configuration

### Network Configuration

Edit `src/config/networks.ts`:

```typescript
export const NETWORKS: Record<string, NetworkConfig> = {
  ETH: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL || '',
    tokenAddress: process.env.ETH_TOKEN_ADDRESS || '0x...',
    isNative: false,
    symbol: 'ERC20'
  },
  // ... other networks
};

export const MONITORED_WALLETS: string[] = [
  '0x742d35Cc6634C0532925a3b8D0B4E4A8b9d7B1e3',
  // ... add your wallet addresses
];
```

### Monitoring Schedule

The service uses cron patterns for scheduling:
- `* * * * *` - Every minute (default)
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight

## Database Schema

### Tables

- **networks**: Network configurations (ETH, BSC, EDGEN)
- **wallets**: Monitored wallet addresses
- **balance_snapshots**: Historical balance data with timestamps

### Key Features

- UUID primary keys for balance snapshots
- Decimal precision for large numbers (36,18)
- Indexed queries for performance
- Automatic timestamp tracking

## Logging

The service uses Winston for structured logging:
- Console output in development
- File logging (`logs/combined.log`, `logs/error.log`)
- Configurable log levels
- Request/response logging

## Development

### Adding New Networks

1. Add network configuration to `src/config/networks.ts`
2. Update database with new network entry
3. Restart the service

### Adding New Wallets

1. Add wallet addresses to `MONITORED_WALLETS` in `src/config/networks.ts`
2. Service will automatically initialize new wallets

### Extending Functionality

- Add new API endpoints in `src/routes/`
- Create new services in `src/services/`
- Extend database schema in `src/database/schema.sql`

## Monitoring and Maintenance

### Health Checks

- `/health` - Basic service health
- `/api/monitoring/health` - Comprehensive health including network connectivity

### Cleanup

Run periodic cleanup to manage database size:
```bash
curl -X POST http://localhost:3001/api/monitoring/cleanup \
  -H "Content-Type: application/json" \
  -d '{"days_to_keep": 30}'
```

### Monitoring Status

Check if monitoring is active:
```bash
curl http://localhost:3001/api/monitoring/status
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database credentials
3. Set up process manager (PM2, Docker, etc.)
4. Configure reverse proxy (nginx)
5. Set up monitoring and alerting
6. Configure log rotation

## Error Handling

The service includes comprehensive error handling:
- Database connection failures
- Network connectivity issues
- Invalid wallet addresses
- Malformed requests
- Rate limiting (implement as needed)

## Security Considerations

- Environment variables for sensitive data
- Database connection pooling
- Input validation using Zod
- Structured error responses (no sensitive data exposure)
- CORS configuration for frontend integration

## License

MIT License - see LICENSE file for details. 