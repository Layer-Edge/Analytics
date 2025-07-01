import express from 'express';
import { z } from 'zod';
import { BigNumber } from 'ethers';
import { BalanceRepository, NetworkRepository, WalletRepository } from '../repositories/BalanceRepository';
import { BalanceFilters, PaginationParams, PeriodicSampleFilters } from '../models/types';
import { logger } from '../utils/logger';

const router = express.Router();
const balanceRepository = new BalanceRepository();
const networkRepository = new NetworkRepository();
const walletRepository = new WalletRepository();

// Validation schemas
const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

const balanceFiltersSchema = z.object({
  wallet_addresses: z.array(z.string()).optional(),
  network_names: z.array(z.string()).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
});

const historyParamsSchema = z.object({
  wallet_address: z.string().min(1),
  network_name: z.string().min(1),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
});

const periodicSampleSchema = z.object({
  interval_hours: z.number().min(1).max(168).default(6), // Max 1 week intervals
  position: z.enum(['first', 'last']).default('last')
});

// Helper function to parse query parameters
const parseQueryParams = (req: express.Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const filters: BalanceFilters = {};
  
  if (req.query.wallet_addresses) {
    const addresses = Array.isArray(req.query.wallet_addresses) 
      ? req.query.wallet_addresses 
      : [req.query.wallet_addresses];
    filters.wallet_addresses = addresses as string[];
  }
  
  if (req.query.network_names) {
    const networks = Array.isArray(req.query.network_names) 
      ? req.query.network_names 
      : [req.query.network_names];
    filters.network_names = networks as string[];
  }
  
  if (req.query.start_date) {
    filters.start_date = new Date(req.query.start_date as string);
  }
  
  if (req.query.end_date) {
    filters.end_date = new Date(req.query.end_date as string);
  }

  const pagination: PaginationParams = {
    page,
    limit,
    offset: (page - 1) * limit
  };

  return { filters, pagination };
};

// GET /api/balances - Get balance snapshots with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { filters, pagination } = parseQueryParams(req);
    
    logger.info('Fetching balance snapshots', { filters, pagination });
    
    const result = await balanceRepository.getBalanceSnapshots(filters, pagination);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      filters: filters
    });
  } catch (error) {
    logger.error('Error fetching balance snapshots', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance snapshots',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/balances/latest - Get latest balance for each wallet-network combination
router.get('/latest', async (req, res) => {
  try {
    logger.info('Fetching latest balances');
    
    const balances = await balanceRepository.getLatestBalances();
    
    res.json({
      success: true,
      data: balances,
      count: balances.length
    });
  } catch (error) {
    logger.error('Error fetching latest balances', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest balances',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/balances/history/:wallet_address/:network_name - Get balance history for specific wallet and network
router.get('/history/:wallet_address/:network_name', async (req, res) => {
  try {
    const { wallet_address, network_name } = req.params;
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
    
    logger.info('Fetching balance history', { wallet_address, network_name, startDate, endDate });
    
    const history = await balanceRepository.getBalanceHistory(
      wallet_address,
      network_name,
      startDate,
      endDate
    );
    
    res.json({
      success: true,
      data: history,
      count: history.length,
      wallet_address,
      network_name,
      date_range: {
        start_date: startDate,
        end_date: endDate
      }
    });
  } catch (error) {
    logger.error('Error fetching balance history', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/balances/summary - Get balance summary statistics
router.get('/summary', async (req, res) => {
  try {
    logger.info('Fetching balance summary');
    
    const latestBalances = await balanceRepository.getLatestBalances();
    
    // Group by network
    const byNetwork = latestBalances.reduce((acc, balance) => {
      if (!acc[balance.network_name]) {
        acc[balance.network_name] = [];
      }
      acc[balance.network_name].push(balance);
      return acc;
    }, {} as Record<string, typeof latestBalances>);
    
    // Group by wallet
    const byWallet = latestBalances.reduce((acc, balance) => {
      if (!acc[balance.wallet_address]) {
        acc[balance.wallet_address] = [];
      }
      acc[balance.wallet_address].push(balance);
      return acc;
    }, {} as Record<string, typeof latestBalances>);
    
    const summary = {
      total_snapshots: latestBalances.length,
      unique_wallets: Object.keys(byWallet).length,
      unique_networks: Object.keys(byNetwork).length,
      by_network: Object.keys(byNetwork).map(network => ({
        network_name: network,
        wallet_count: byNetwork[network].length,
        total_balance: byNetwork[network].reduce((sum, b) => {
          try {
            return sum.add(BigNumber.from(b.balance));
          } catch (error) {
            logger.warn(`Invalid balance format for ${b.wallet_address} on ${network}: ${b.balance}`);
            return sum;
          }
        }, BigNumber.from(0)).toString()
      })),
      by_wallet: Object.keys(byWallet).map(wallet => ({
        wallet_address: wallet,
        network_count: byWallet[wallet].length,
        balances: byWallet[wallet].map(b => ({
          network_name: b.network_name,
          balance: b.balance,
          timestamp: b.timestamp
        }))
      }))
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching balance summary', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/balances/chart-data - Get data formatted for chart visualization
router.get('/chart-data', async (req, res) => {
  try {
    const { filters, pagination } = parseQueryParams(req);
    
    // For chart data, we might want a larger limit
    pagination.limit = Math.min(pagination.limit, 1000);
    pagination.offset = (pagination.page - 1) * pagination.limit;
    
    logger.info('Fetching chart data', { filters, pagination });
    
    const result = await balanceRepository.getBalanceSnapshots(filters, pagination);
    
    // Transform data for chart consumption
    const chartData = result.data.map(balance => ({
      timestamp: balance.timestamp,
      balance: balance.balance, // Keep as string - frontend can format as needed
      wallet_address: balance.wallet_address,
      wallet_label: balance.wallet_label,
      network_name: balance.network_name,
      network_symbol: balance.network_symbol,
      is_native: balance.is_native,
      block_number: balance.block_number
    }));
    
    // Group data for time series
    const timeSeriesData = chartData.reduce((acc, item) => {
      const key = `${item.wallet_address}-${item.network_name}`;
      if (!acc[key]) {
        acc[key] = {
          wallet_address: item.wallet_address,
          wallet_label: item.wallet_label,
          network_name: item.network_name,
          network_symbol: item.network_symbol,
          is_native: item.is_native,
          data_points: []
        };
      }
      
      acc[key].data_points.push({
        timestamp: item.timestamp,
        balance: item.balance, // Raw BigNumber string - frontend handles formatting
        block_number: item.block_number
      });
      
      return acc;
    }, {} as Record<string, any>);
    
    res.json({
      success: true,
      chart_data: chartData,
      time_series: Object.values(timeSeriesData),
      pagination: result.pagination,
      filters: filters
    });
  } catch (error) {
    logger.error('Error fetching chart data', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chart data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/balances/networks - Get all available networks
router.get('/networks', async (req, res) => {
  try {
    const networks = await networkRepository.getAllNetworks();
    
    res.json({
      success: true,
      data: networks
    });
  } catch (error) {
    logger.error('Error fetching networks', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch networks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/balances/wallets - Get all available wallets
router.get('/wallets', async (req, res) => {
  try {
    const wallets = await walletRepository.getAllWallets();
    
    res.json({
      success: true,
      data: wallets
    });
  } catch (error) {
    logger.error('Error fetching wallets', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallets',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/balances/periodic-samples - Get periodic samples using actual data timespan
router.get('/periodic-samples', async (req, res) => {
  try {
    // Parse periodic sample parameters
    const intervalHours = parseFloat(req.query.interval_hours as string) || 6;
    const position = (req.query.position as string) || 'last';
    
    // Validate parameters
    const paramValidation = periodicSampleSchema.safeParse({
      interval_hours: intervalHours,
      position: position
    });
    
    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid periodic sample parameters',
        details: paramValidation.error.issues
      });
    }
    
    // Build filters for the periodic sample method
    const filters: PeriodicSampleFilters = {};
    
    if (req.query.wallet_addresses) {
      const addresses = Array.isArray(req.query.wallet_addresses) 
        ? req.query.wallet_addresses 
        : [req.query.wallet_addresses];
      filters.wallet_addresses = addresses as string[];
    }
    
    if (req.query.network_names) {
      const networks = Array.isArray(req.query.network_names) 
        ? req.query.network_names 
        : [req.query.network_names];
      filters.network_names = networks as string[];
    }
    
    if (req.query.since_date) {
      filters.since_date = new Date(req.query.since_date as string);
    }
    
    logger.info('Fetching periodic samples', { intervalHours, position, filters });
    
    const result = await balanceRepository.getPeriodicBalanceSnapshotsFromActualData(
      paramValidation.data.interval_hours,
      paramValidation.data.position,
      filters
    );
    
    res.json({
      success: true,
      data: result,
      count: result.length,
      parameters: {
        interval_hours: paramValidation.data.interval_hours,
        position: paramValidation.data.position
      },
      filters: filters
    });
  } catch (error) {
    logger.error('Error fetching periodic samples', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch periodic samples',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/balances/time-series - Get optimized time series data with dynamic intervals
router.get('/time-series', async (req, res) => {
  try {
    const maxPoints = parseInt(req.query.max_points as string) || 100;
    
    // Validate max points
    if (maxPoints < 10 || maxPoints > 1000) {
      return res.status(400).json({
        success: false,
        error: 'max_points must be between 10 and 1000'
      });
    }
    
    // Build filters for the time series method
    const filters: PeriodicSampleFilters = {};
    
    if (req.query.wallet_addresses) {
      const addresses = Array.isArray(req.query.wallet_addresses) 
        ? req.query.wallet_addresses 
        : [req.query.wallet_addresses];
      filters.wallet_addresses = addresses as string[];
    }
    
    if (req.query.network_names) {
      const networks = Array.isArray(req.query.network_names) 
        ? req.query.network_names 
        : [req.query.network_names];
      filters.network_names = networks as string[];
    }
    
    if (req.query.since_date) {
      filters.since_date = new Date(req.query.since_date as string);
    }
    
    logger.info('Fetching time series data', { filters, maxPoints });
    
    const result = await balanceRepository.getTimeSeriesData(filters, maxPoints);
    
    res.json({
      success: true,
      data: result,
      count: result.length,
      max_points_requested: maxPoints,
      filters: filters
    });
  } catch (error) {
    logger.error('Error fetching time series data', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time series data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 
