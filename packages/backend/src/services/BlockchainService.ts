import { ethers } from 'ethers';
import { NETWORKS, NetworkConfig } from '../config/networks';
import { logger } from '../utils/logger';
import { BalanceRepository } from '../repositories/BalanceRepository';

// ERC20 ABI for token balance queries
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

export interface BalanceResult {
  address: string;
  networkName: string;
  balance: string;
  blockNumber: number;
  timestamp: Date;
}

export class BlockchainService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private tokenContracts: Map<string, ethers.Contract> = new Map();
  private balanceRepository: BalanceRepository;

  constructor() {
    this.balanceRepository = new BalanceRepository();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    Object.entries(NETWORKS).forEach(([key, network]) => {
      if (!network.rpcUrl) {
        logger.warn(`No RPC URL configured for network: ${network.name}`);
        return;
      }

      try {
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);
        this.providers.set(key, provider);

        // Initialize token contract for ERC20 tokens
        if (!network.isNative && network.tokenAddress) {
          const contract = new ethers.Contract(network.tokenAddress, ERC20_ABI, provider);
          this.tokenContracts.set(key, contract);
        }

        logger.info(`Initialized provider for network: ${network.name}`);
      } catch (error) {
        logger.error(`Failed to initialize provider for network: ${network.name}`, error);
      }
    });
  }

  // Get native token balance (ETH, BNB, EDGEN)
  private async getNativeBalance(
    provider: ethers.JsonRpcProvider,
    address: string
  ): Promise<{ balance: string; blockNumber: number }> {
    try {
      const balance = await provider.getBalance(address);
      const blockNumber = await provider.getBlockNumber();
      
      return {
        balance: balance.toString(),
        blockNumber
      };
    } catch (error) {
      logger.error(`Failed to get native balance for address: ${address}`, error);
      throw error;
    }
  }

  // Get ERC20 token balance
  private async getTokenBalance(
    contract: ethers.Contract,
    address: string
  ): Promise<{ balance: string; blockNumber: number }> {
    try {
      const provider = contract.runner?.provider as ethers.JsonRpcProvider;
      const balance = await contract.balanceOf(address);
      const blockNumber = await provider.getBlockNumber();

      
      return {
        balance: balance.toString(),
        blockNumber
      };
    } catch (error) {
      logger.error(`Failed to get token balance for address: ${address}`, error);
      throw error;
    }
  }

  // Get balance for a specific wallet on a specific network
  async getBalance(networkKey: string, walletAddress: string): Promise<BalanceResult> {
    const network = NETWORKS[networkKey];
    if (!network) {
      throw new Error(`Network not found: ${networkKey}`);
    }

    const provider = this.providers.get(networkKey);
    if (!provider) {
      throw new Error(`Provider not initialized for network: ${networkKey}`);
    }

    let balanceData: { balance: string; blockNumber: number };

    if (network.isNative) {
      // Get native token balance
      balanceData = await this.getNativeBalance(provider, walletAddress);
    } else {
      // Get ERC20 token balance
      const contract = this.tokenContracts.get(networkKey);
      if (!contract) {
        throw new Error(`Token contract not initialized for network: ${networkKey}`);
      }
      balanceData = await this.getTokenBalance(contract, walletAddress);
    }

    return {
      address: walletAddress,
      networkName: networkKey,
      balance: balanceData.balance,
      blockNumber: balanceData.blockNumber,
      timestamp: new Date()
    };
  }

  // Get the last known balance for a wallet-network combination
  private async getLastKnownBalance(
    walletAddress: string, 
    networkName: string
  ): Promise<string> {
    try {
      // Get the most recent balance snapshot for this wallet-network combination
      const history = await this.balanceRepository.getBalanceHistory(
        walletAddress,
        networkName,
        undefined, // no start date
        undefined  // no end date
      );
      
      if (history.length > 0) {
        // Return the most recent balance (history is ordered by timestamp ASC, so get the last one)
        const lastBalance = history[history.length - 1].balance;
        logger.info(`Using last known balance ${lastBalance} for ${walletAddress} on ${networkName}`);
        return lastBalance;
      }
      
      // If no previous balance exists, return '0'
      logger.warn(`No previous balance found for ${walletAddress} on ${networkName}, using 0`);
      return '0';
    } catch (error) {
      logger.error(`Failed to get last known balance for ${walletAddress} on ${networkName}:`, error);
      return '0';
    }
  }

  // Get balances for multiple wallets on multiple networks
  async getMultipleBalances(
    networkKeys: string[],
    walletAddresses: string[]
  ): Promise<BalanceResult[]> {
    const results: BalanceResult[] = [];
    const promises: Promise<BalanceResult>[] = [];

    for (const networkKey of networkKeys) {
      for (const walletAddress of walletAddresses) {
        promises.push(
          this.getBalance(networkKey, walletAddress).catch(async (error) => {
            logger.error(`Failed to get balance for ${walletAddress} on ${networkKey}`, error);
            
            // Get the last known balance instead of using '0'
            const lastKnownBalance = await this.getLastKnownBalance(walletAddress, networkKey);
            
            return {
              address: walletAddress,
              networkName: networkKey,
              balance: lastKnownBalance,
              blockNumber: 0,
              timestamp: new Date()
            };
          })
        );
      }
    }

    const balanceResults = await Promise.allSettled(promises);
    
    balanceResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        logger.error(`Balance fetch failed for index ${index}:`, result.reason);
      }
    });

    return results;
  }

  // Get balances for all configured wallets and networks
  async getAllBalances(): Promise<BalanceResult[]> {
    const { MONITORED_WALLETS } = await import('../config/networks');
    const networkKeys = Object.keys(NETWORKS);
    
    logger.info(`Fetching balances for ${MONITORED_WALLETS.length} wallets across ${networkKeys.length} networks`);
    
    return this.getMultipleBalances(networkKeys, MONITORED_WALLETS);
  }

  // Test connection to a specific network
  async testNetworkConnection(networkKey: string): Promise<boolean> {
    try {
      const provider = this.providers.get(networkKey);
      if (!provider) {
        return false;
      }

      const blockNumber = await provider.getBlockNumber();
      logger.info(`Network ${networkKey} connection test successful. Block number: ${blockNumber}`);
      return true;
    } catch (error) {
      logger.error(`Network ${networkKey} connection test failed:`, error);
      return false;
    }
  }

  // Test all network connections
  async testAllNetworkConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const networkKeys = Object.keys(NETWORKS);

    for (const networkKey of networkKeys) {
      results[networkKey] = await this.testNetworkConnection(networkKey);
    }

    return results;
  }

  // Get token information (for ERC20 tokens)
  async getTokenInfo(networkKey: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  } | null> {
    const contract = this.tokenContracts.get(networkKey);
    if (!contract) {
      return null;
    }

    try {
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);

      return { name, symbol, decimals };
    } catch (error) {
      logger.error(`Failed to get token info for network: ${networkKey}`, error);
      return null;
    }
  }

  // Refresh providers (useful for updating RPC URLs)
  refreshProviders(): void {
    this.providers.clear();
    this.tokenContracts.clear();
    this.initializeProviders();
    logger.info('Blockchain providers refreshed');
  }
} 