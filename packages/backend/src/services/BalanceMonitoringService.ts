import cron from 'node-cron';
import { BlockchainService, BalanceResult } from './BlockchainService';
import { BalanceRepository, NetworkRepository, WalletRepository } from '../repositories/BalanceRepository';
import { MONITORED_WALLETS, NETWORKS, CRON_PATTERN } from '../config/networks';
import { logger } from '../utils/logger';
import { Wallet, Network } from '../models/types';

export class BalanceMonitoringService {
  private blockchainService: BlockchainService;
  private balanceRepository: BalanceRepository;
  private networkRepository: NetworkRepository;
  private walletRepository: WalletRepository;
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;
  
  // Add cached lookup maps
  private walletMap: Map<string, Wallet> = new Map();
  private networkMap: Map<string, Network> = new Map();

  constructor() {
    this.blockchainService = new BlockchainService();
    this.balanceRepository = new BalanceRepository();
    this.networkRepository = new NetworkRepository();
    this.walletRepository = new WalletRepository();
  }

  async initialize(): Promise<void> {
    try {
      await this.initializeWallets();
      await this.initializeLookupMaps();
      await this.testConnections();
      logger.info('Balance monitoring service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize balance monitoring service', error);
      throw error;
    }
  }

  private async initializeWallets(): Promise<void> {
    logger.info('Initializing wallets in database...');
    
    for (const walletAddress of MONITORED_WALLETS) {
      try {
        await this.walletRepository.createWallet(walletAddress);
        logger.debug(`Wallet initialized: ${walletAddress}`);
      } catch (error) {
        logger.error(`Failed to initialize wallet: ${walletAddress}`, error);
      }
    }

    logger.info(`Initialized ${MONITORED_WALLETS.length} wallets`);
  }

  private async initializeLookupMaps(): Promise<void> {
    logger.info('Initializing wallet and network lookup maps...');
    
    const [allWallets, allNetworks] = await Promise.all([
      this.walletRepository.getAllWallets(),
      this.networkRepository.getAllNetworks()
    ]);
    
    // Build lookup maps
    this.walletMap = new Map(allWallets.map(w => [w.address, w]));
    this.networkMap = new Map(allNetworks.map(n => [n.name, n]));
    
    logger.info(`Cached ${this.walletMap.size} wallets and ${this.networkMap.size} networks`);
  }

  private async testConnections(): Promise<void> {
    logger.info('Testing network connections...');
    const connectionResults = await this.blockchainService.testAllNetworkConnections();
    
    Object.entries(connectionResults).forEach(([network, isConnected]) => {
      if (isConnected) {
        logger.info(`✅ Network ${network} connection successful`);
      } else {
        logger.warn(`❌ Network ${network} connection failed`);
      }
    });
  }

  async fetchAndStoreBalances(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Balance fetch already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting balance fetch cycle...');
      const balanceResults = await this.blockchainService.getAllBalances();
      logger.info(`Fetched ${balanceResults.length} balance records`);
      await this.processBalanceResults(balanceResults);
      const duration = Date.now() - startTime;
      logger.info(`Balance fetch cycle completed in ${duration}ms`);
    } catch (error) {
      logger.error('Error during balance fetch cycle', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async processBalanceResults(balanceResults: BalanceResult[]): Promise<void> {
    if (balanceResults.length === 0) {
      logger.info('No balance results to process');
      return;
    }

    try {
      // Use cached lookup maps (no database queries needed!)
      const validSnapshots: Array<{
        wallet_id: number;
        network_id: number;
        balance: string;
        block_number?: number;
        timestamp?: Date;
      }> = [];
      const errors: string[] = [];
      
      for (const result of balanceResults) {
        const wallet = this.walletMap.get(result.address);
        const network = this.networkMap.get(result.networkName);
        
        if (!wallet) {
          errors.push(`Wallet not found: ${result.address}`);
          continue;
        }
        
        if (!network) {
          errors.push(`Network not found: ${result.networkName}`);
          continue;
        }
        
        validSnapshots.push({
          wallet_id: wallet.id,
          network_id: network.id,
          balance: result.balance,
          block_number: result.blockNumber,
          timestamp: result.timestamp
        });
      }
      
      // Log errors for missing references
      if (errors.length > 0) {
        logger.warn(`Skipped ${errors.length} balance results due to missing references:`, errors);
      }
      
      // Only 1 database query: the bulk insert
      if (validSnapshots.length > 0) {
        await this.balanceRepository.createBalanceSnapshotsBulk(validSnapshots);
        logger.info(`Successfully processed ${validSnapshots.length} balance snapshots (${errors.length} skipped)`);
      } else {
        logger.warn('No valid balance snapshots to insert');
      }
      
    } catch (error) {
      logger.error('Error during bulk balance processing:', error);
      throw error;
    }
  }

  startMonitoring(cronPattern: string = CRON_PATTERN): void {
    if (this.cronJob) {
      logger.warn('Monitoring already started');
      return;
    }

    logger.info(`Starting balance monitoring with pattern: ${cronPattern}`);

    this.cronJob = cron.schedule(cronPattern, async () => {
      await this.fetchAndStoreBalances();
    }, {
      scheduled: false
    });

    this.cronJob.start();
    logger.info('Balance monitoring started');
  }

  stopMonitoring(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Balance monitoring stopped');
    }
  }

  // Method to refresh lookup maps when wallets/networks are added
  async refreshLookupMaps(): Promise<void> {
    logger.info('Refreshing wallet and network lookup maps...');
    await this.initializeLookupMaps();
  }
} 
