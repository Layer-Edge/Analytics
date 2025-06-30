import cron from 'node-cron';
import { BlockchainService, BalanceResult } from './BlockchainService';
import { BalanceRepository, NetworkRepository, WalletRepository } from '../repositories/BalanceRepository';
import { MONITORED_WALLETS, NETWORKS } from '../config/networks';
import { logger } from '../utils/logger';

export class BalanceMonitoringService {
  private blockchainService: BlockchainService;
  private balanceRepository: BalanceRepository;
  private networkRepository: NetworkRepository;
  private walletRepository: WalletRepository;
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.blockchainService = new BlockchainService();
    this.balanceRepository = new BalanceRepository();
    this.networkRepository = new NetworkRepository();
    this.walletRepository = new WalletRepository();
  }

  async initialize(): Promise<void> {
    try {
      await this.initializeWallets();
      await this.updateNetworkConfigurations();
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

  private async updateNetworkConfigurations(): Promise<void> {
    logger.info('Updating network configurations...');

    for (const [networkKey, networkConfig] of Object.entries(NETWORKS)) {
      try {
        const existingNetwork = await this.networkRepository.getNetworkByName(networkKey);
        if (existingNetwork && networkConfig.rpcUrl) {
          await this.networkRepository.updateNetworkRpcUrl(existingNetwork.id, networkConfig.rpcUrl);
          logger.debug(`Updated RPC URL for network: ${networkKey}`);
        }
      } catch (error) {
        logger.error(`Failed to update network configuration: ${networkKey}`, error);
      }
    }
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
    const promises: Promise<void>[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const result of balanceResults) {
      promises.push(
        this.storeBalanceResult(result)
          .then(() => {
            successCount++;
          })
          .catch(error => {
            errorCount++;
            logger.error(`Failed to store balance for ${result.address} on ${result.networkName}`, error);
          })
      );
    }

    await Promise.allSettled(promises);
    logger.info(`Stored balances: ${successCount} successful, ${errorCount} failed`);
  }

  private async storeBalanceResult(result: BalanceResult): Promise<void> {
    try {
      const wallet = await this.walletRepository.getWalletByAddress(result.address);
      const network = await this.networkRepository.getNetworkByName(result.networkName);

      if (!wallet) {
        throw new Error(`Wallet not found: ${result.address}`);
      }

      if (!network) {
        throw new Error(`Network not found: ${result.networkName}`);
      }

      await this.balanceRepository.createBalanceSnapshot({
        wallet_id: wallet.id,
        network_id: network.id,
        balance: result.balance,
        block_number: result.blockNumber,
        timestamp: result.timestamp
      });

      logger.debug(`Stored balance: ${result.address} on ${result.networkName} = ${result.balance}`);
    } catch (error) {
      logger.error(`Failed to store balance result`, { result, error });
      throw error;
    }
  }

  /**
   * Starts monitoring balances on a schedule defined by the cron pattern.
   * Default pattern '* * * * *' runs every minute.
   * Cron format: minute hour day-of-month month day-of-week
   * @param cronPattern Cron schedule pattern (default: every minute)
   */
  startMonitoring(cronPattern: string = '* * * * *'): void {
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

  getStatus(): {
    isRunning: boolean;
    isMonitoring: boolean;
  } {
    return {
      isRunning: this.isRunning,
      isMonitoring: this.cronJob !== null
    };
  }

  async triggerBalanceFetch(): Promise<void> {
    logger.info('Manual balance fetch triggered');
    await this.fetchAndStoreBalances();
  }

  async cleanupOldData(daysToKeep: number = 30): Promise<number> {
    logger.info(`Cleaning up balance snapshots older than ${daysToKeep} days`);
    return this.balanceRepository.cleanupOldSnapshots(daysToKeep);
  }

  async getLatestBalances() {
    return this.balanceRepository.getLatestBalances();
  }
} 