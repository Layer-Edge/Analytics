import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './database/connection';
import { logger } from './utils/logger';
import { BalanceMonitoringService } from './services/BalanceMonitoringService';
import balanceRoutes from './routes/balanceRoutes';
import monitoringRoutes from './routes/monitoringRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global monitoring service instance
let monitoringService: BalanceMonitoringService;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.use('/api/balances', balanceRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: '@analytics/backend',
    version: '0.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Analytics Backend API',
    version: '0.0.0',
    endpoints: {
      health: '/health',
      balances: '/api/balances',
      monitoring: '/api/monitoring'
    },
    documentation: {
      balance_endpoints: [
        'GET /api/balances - Get balance snapshots with filtering and pagination',
        'GET /api/balances/latest - Get latest balances',
        'GET /api/balances/history/:wallet/:network - Get balance history',
        'GET /api/balances/summary - Get balance summary',
        'GET /api/balances/chart-data - Get chart data',
        'GET /api/balances/networks - Get all networks',
        'GET /api/balances/wallets - Get all wallets'
      ],
      monitoring_endpoints: [
        'GET /api/monitoring/status - Get monitoring status',
        'POST /api/monitoring/start - Start monitoring',
        'POST /api/monitoring/stop - Stop monitoring',
        'POST /api/monitoring/trigger - Trigger manual fetch',
        'GET /api/monitoring/health - Comprehensive health check'
      ]
    }
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize monitoring service
    monitoringService = new BalanceMonitoringService();
    await monitoringService.initialize();
    monitoringService.startMonitoring();

    // Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 Backend server running on http://localhost:${PORT}`);
      logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
      logger.info(`📈 API documentation at http://localhost:${PORT}/`);
      logger.info(`🔍 Balance monitoring service initialized`);
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    // Stop monitoring service
    if (monitoringService) {
      monitoringService.stopMonitoring();
    }

    // Close database connections
    await db.close();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app; 