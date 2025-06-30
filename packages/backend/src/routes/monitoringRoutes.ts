import express from 'express';
import { BalanceMonitoringService } from '../services/BalanceMonitoringService';
import { BlockchainService } from '../services/BlockchainService';
import { logger } from '../utils/logger';

const router = express.Router();
let balanceMonitoringService: BalanceMonitoringService;

// Initialize the monitoring service
const initializeService = async () => {
  if (!balanceMonitoringService) {
    balanceMonitoringService = new BalanceMonitoringService();
    await balanceMonitoringService.initialize();
  }
  return balanceMonitoringService;
};

// GET /api/monitoring/status - Get monitoring service status
router.get('/status', async (req, res) => {
  try {
    const service = await initializeService();
    const status = service.getStatus();
    
    res.json({
      success: true,
      data: {
        service: 'BalanceMonitoringService',
        ...status,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting monitoring status', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/monitoring/start - Start periodic balance monitoring
router.post('/start', async (req, res) => {
  try {
    const { cron_pattern } = req.body;
    const service = await initializeService();
    
    // Default to every minute if no pattern provided
    const cronPattern = cron_pattern || '* * * * *';
    
    service.startMonitoring(cronPattern);
    
    res.json({
      success: true,
      message: 'Balance monitoring started',
      cron_pattern: cronPattern
    });
  } catch (error) {
    logger.error('Error starting monitoring', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/monitoring/stop - Stop periodic balance monitoring
router.post('/stop', async (req, res) => {
  try {
    const service = await initializeService();
    service.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Balance monitoring stopped'
    });
  } catch (error) {
    logger.error('Error stopping monitoring', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/monitoring/trigger - Manually trigger balance fetch
router.post('/trigger', async (req, res) => {
  try {
    const service = await initializeService();
    
    // Don't wait for completion, trigger async
    service.triggerBalanceFetch().catch(error => {
      logger.error('Manual balance fetch failed', error);
    });
    
    res.json({
      success: true,
      message: 'Balance fetch triggered manually'
    });
  } catch (error) {
    logger.error('Error triggering balance fetch', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger balance fetch',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/monitoring/health - Comprehensive health check
router.get('/health', async (req, res) => {
  try {
    const service = await initializeService();
    const blockchainService = new BlockchainService();
    
    // Test network connections
    const networkConnections = await blockchainService.testAllNetworkConnections();
    
    // Get service status
    const serviceStatus = service.getStatus();
    
    // Get latest balances count
    const latestBalances = await service.getLatestBalances();
    
    const healthData = {
      overall_status: Object.values(networkConnections).every(status => status) ? 'healthy' : 'degraded',
      service_status: serviceStatus,
      network_connections: networkConnections,
      latest_balances_count: latestBalances.length,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version,
        platform: process.platform
      },
      timestamp: new Date().toISOString()
    };
    
    const statusCode = healthData.overall_status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: healthData.overall_status === 'healthy',
      data: healthData
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/monitoring/cleanup - Clean up old balance snapshots
router.post('/cleanup', async (req, res) => {
  try {
    const { days_to_keep } = req.body;
    const daysToKeep = days_to_keep || 30;
    
    const service = await initializeService();
    const deletedCount = await service.cleanupOldData(daysToKeep);
    
    res.json({
      success: true,
      message: `Cleaned up old balance snapshots`,
      deleted_count: deletedCount,
      days_kept: daysToKeep
    });
  } catch (error) {
    logger.error('Error during cleanup', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/monitoring/networks/test - Test all network connections
router.get('/networks/test', async (req, res) => {
  try {
    const blockchainService = new BlockchainService();
    const connectionResults = await blockchainService.testAllNetworkConnections();
    
    const allHealthy = Object.values(connectionResults).every(status => status);
    
    res.json({
      success: true,
      data: {
        all_networks_healthy: allHealthy,
        connections: connectionResults,
        tested_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error testing network connections', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test network connections',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/monitoring/networks/:network/test - Test specific network connection
router.get('/networks/:network/test', async (req, res) => {
  try {
    const { network } = req.params;
    const blockchainService = new BlockchainService();
    
    const isConnected = await blockchainService.testNetworkConnection(network);
    
    res.json({
      success: true,
      data: {
        network,
        is_connected: isConnected,
        tested_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error testing ${req.params.network} connection`, error);
    res.status(500).json({
      success: false,
      error: `Failed to test ${req.params.network} connection`,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/monitoring/networks/:network/token-info - Get token information for a network
router.get('/networks/:network/token-info', async (req, res) => {
  try {
    const { network } = req.params;
    const blockchainService = new BlockchainService();
    
    const tokenInfo = await blockchainService.getTokenInfo(network);
    
    if (!tokenInfo) {
      return res.status(404).json({
        success: false,
        error: 'Token information not available',
        message: 'This network may not have a token contract or it may be a native token'
      });
    }
    
    res.json({
      success: true,
      data: {
        network,
        token_info: tokenInfo,
        retrieved_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error getting token info for ${req.params.network}`, error);
    res.status(500).json({
      success: false,
      error: `Failed to get token info for ${req.params.network}`,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 