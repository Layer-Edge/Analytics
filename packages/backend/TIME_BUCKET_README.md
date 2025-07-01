# Periodic Balance Sampling System

The periodic sampling system provides efficient time-based data retrieval for balance monitoring. This system automatically calculates optimal time intervals from your actual data and returns representative samples instead of processing all raw records.

## Key Features

- **Automatic Time Calculation**: Uses actual data timespan instead of fixed parameters
- **Simple API**: Just specify interval hours and position strategy
- **High Performance**: Uses PostgreSQL's DISTINCT ON with optimized queries
- **Flexible Filtering**: Works with wallet addresses, networks, and date ranges
- **Rich Metadata**: Returns timing information and data coverage statistics

## Use Cases

### 1. Chart Optimization
Get optimally spaced data points for any timeframe:
```bash
GET /api/balances/time-series?max_points=100&network_names=ETH
```

### 2. Periodic Reports
Get one sample every N hours from your actual data:
```bash
GET /api/balances/periodic-samples?interval_hours=6&position=last&network_names=ETH
```

### 3. Data Coverage Analysis
Understand your data's time distribution and gaps:
```bash
GET /api/balances/periodic-samples?interval_hours=1&network_names=ETH,BSC
```

## API Endpoints

### GET `/api/balances/periodic-samples`

Get periodic samples based on actual data timespan with configurable intervals.

**Query Parameters:**
- `interval_hours` (number, 1-168): Hours between samples (default: 6)
- `position` (string): Which sample to pick from each interval
  - `first` - Earliest timestamp in interval
  - `last` - Latest timestamp in interval (default)
- `wallet_addresses` (string[]): Filter by specific wallet addresses
- `network_names` (string[]): Filter by specific networks  
- `since_date` (ISO string): Only consider data after this date

**Example:**
```bash
# Get samples every 6 hours using latest values
GET /api/balances/periodic-samples?interval_hours=6&position=last&network_names=ETH

# Get daily samples for specific wallets
GET /api/balances/periodic-samples?interval_hours=24&wallet_addresses=0x123...&since_date=2024-01-01T00:00:00Z
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "wallet_address": "0x123...",
      "network_name": "ETH", 
      "balance": "1000000000000000000",
      "timestamp": "2024-01-01T12:00:00Z",
      "period_start": "2024-01-01T06:00:00Z",
      "period_end": "2024-01-01T12:00:00Z",
      "period_index": 0,
      "total_hours": 168.5,
      "first_timestamp": "2024-01-01T00:00:00Z",
      "last_timestamp": "2024-01-07T12:30:00Z",
      "expected_periods": 28
    }
  ],
  "count": 28,
  "parameters": {
    "interval_hours": 6,
    "position": "last"
  }
}
```

### GET `/api/balances/time-series`

Get optimized time series data with automatic interval calculation.

**Query Parameters:**
- `max_points` (number, 10-1000): Target number of data points (default: 100)
- `wallet_addresses` (string[]): Filter by specific wallets
- `network_names` (string[]): Filter by specific networks
- `since_date` (ISO string): Only consider data after this date

**Example:**
```bash
# Get up to 50 optimally spaced points
GET /api/balances/time-series?max_points=50&network_names=ETH,BSC

# Get time series since a specific date
GET /api/balances/time-series?since_date=2024-01-01T00:00:00Z&max_points=200
```

## Response Data Structure

Each sample includes comprehensive timing metadata:

- **`period_start/period_end`**: Exact time boundaries for this sample's period
- **`period_index`**: Sequential number of this period (0-based)
- **`total_hours`**: Total timespan covered by all your data
- **`first_timestamp/last_timestamp`**: Actual bounds of your data
- **`expected_periods`**: How many periods should exist given your data range

## Position Strategies

### First (`first`)
- Selects the earliest record in each time interval
- Best for: Tracking when changes begin, opening values

### Last (`last`)  
- Selects the latest record in each time interval (default)
- Best for: Current state analysis, closing values, time series charts

## Performance Characteristics

### Query Performance (1M+ records)
- **Periodic sampling**: 200-800ms
- **Dynamic time series**: 300-1000ms  
- **Raw data queries**: 5-15 seconds

### Database Optimization
The system uses efficient PostgreSQL features:
- `DISTINCT ON` for optimal record selection
- `LATERAL generate_series` for dynamic time buckets
- `DATE_TRUNC` for clean hour boundaries
- Optimized JOINs with proper indexing

## Examples

### Chart Data for Dashboard
```typescript
// Get 100 optimal points for any data range
const response = await fetch('/api/balances/time-series?max_points=100&network_names=ETH');
const { data } = await response.json();

// Each point includes timing metadata
data.forEach(point => {
  console.log(`Period ${point.period_index}: ${point.balance} (${point.period_start} to ${point.period_end})`);
});
```

### Hourly Samples 
```typescript
// Get hourly samples from actual data
const response = await fetch('/api/balances/periodic-samples?interval_hours=1&position=last');
const { data } = await response.json();

console.log(`Data spans ${data[0]?.total_hours} hours with ${data.length} samples`);
```

### Data Coverage Analysis
```typescript
// Analyze data quality and gaps
const response = await fetch('/api/balances/periodic-samples?interval_hours=6');
const { data } = await response.json();

const sample = data[0];
const coverage = (data.length / sample.expected_periods) * 100;
console.log(`Data coverage: ${coverage.toFixed(1)}% (${data.length}/${sample.expected_periods} periods)`);
```

## Testing

Run the test suite to verify functionality:

```bash
# Test periodic sampling
npx tsx src/test-periodic-samples.ts

# Test with actual database
npm run test:periodic
```

## Database Query Structure

The system uses a 3-step CTE approach:

### 1. Data Timespan Calculation
```sql
WITH data_timespan AS (
  SELECT 
    MIN(bs.timestamp) as first_timestamp,
    MAX(bs.timestamp) as last_timestamp,
    EXTRACT(EPOCH FROM (MAX(bs.timestamp) - MIN(bs.timestamp))) / 3600 as total_hours
  FROM balance_snapshots bs
  -- filters applied here
)
```

### 2. Time Bucket Generation  
```sql
time_buckets AS (
  SELECT 
    bucket_start,
    bucket_start + INTERVAL '6 hours' as bucket_end,
    ROW_NUMBER() OVER (ORDER BY bucket_start) - 1 as period_index
  FROM data_timespan dt,
  LATERAL generate_series(
    DATE_TRUNC('hour', dt.first_timestamp),
    DATE_TRUNC('hour', dt.last_timestamp), 
    INTERVAL '6 hours'
  ) as bucket_start
)
```

### 3. Sample Selection
```sql
SELECT DISTINCT ON (tb.period_index, bs.wallet_id, bs.network_id)
  bs.*, tb.period_start, tb.period_end, tb.period_index
FROM time_buckets tb
JOIN balance_snapshots bs ON bs.timestamp >= tb.bucket_start 
                          AND bs.timestamp < tb.bucket_end
ORDER BY tb.period_index, bs.wallet_id, bs.network_id, bs.timestamp DESC
```

## Monitoring & Troubleshooting

### Performance Monitoring
```
[INFO] Periodic balance query returned 48 samples (312ms)
[INFO] Time series: 168.5h span, 7h intervals, targeting 24 points
```

### Data Quality Checks
- **Low sample count**: Check if monitoring is running consistently
- **Large time gaps**: Verify network connectivity during monitoring periods
- **Performance issues**: Ensure proper database indexes exist

### Common Issues

1. **No data returned**: Verify filters match existing data in database
2. **Poor performance**: Run `scripts/add-time-bucket-indexes.sql` for optimization
3. **Memory issues**: Reduce `max_points` parameter for large datasets

## Migration from Complex Implementation

The new system replaces the previous complex time bucket implementation with:

- ✅ **Simpler API**: Just `interval_hours` and `position` parameters
- ✅ **Better Performance**: Uses DISTINCT ON instead of window functions
- ✅ **Automatic Calculation**: No need to specify total timeframe
- ✅ **Cleaner Code**: Single method instead of multiple strategies
- ✅ **Rich Metadata**: Comprehensive timing information included

### Before (Complex)
```typescript
const response = await fetch('/api/balances/periodic-samples?timeframe_hours=24&interval_hours=6&sample_strategy=last');
```

### After (Simple)
```typescript
const response = await fetch('/api/balances/periodic-samples?interval_hours=6&position=last');
```

The new implementation automatically calculates the timeframe from your actual data, eliminating configuration complexity while providing better performance and more useful metadata. 