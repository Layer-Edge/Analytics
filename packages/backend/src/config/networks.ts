import dotenv from 'dotenv';
import { BigNumber } from 'ethers';
import { logger } from '../utils/logger';
dotenv.config();

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  tokenAddress?: string; // undefined for native tokens
  isNative: boolean;
  symbol: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  ETH: {
    name: 'ETH',
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL || '',
    tokenAddress: process.env.ETH_TOKEN_ADDRESS || '0xAa9806c938836627Ed1a41Ae871c7E1889AE02Ca',
    isNative: false,
    symbol: 'ERC20'
  },
  BSC: {
    name: 'BSC',
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL || '',
    tokenAddress: process.env.BSC_TOKEN_ADDRESS || '0x0C808F0464C423d5Ea4F4454fcc23B6E2Ae75562',
    isNative: false,
    symbol: 'ERC20'
  },
  EDGEN: {
    name: 'EDGEN',
    chainId: 4207,
    rpcUrl: process.env.EDGEN_RPC_URL || 'https://rpc.layeredge.io',
    tokenAddress: undefined, // Native token
    isNative: true,
    symbol: 'EDGEN'
  }
};

export const MONITORED_WALLETS: string[] = [
  '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe', //gate
  '0xf2449A4DB678Fe88b130faB68D7a90FB5Ff884a7', //gate
  '0x58edF78281334335EfFa23101bBe3371b6a36A51', //kucoin
  '0x9021069cE6842Ac73D824941F841810E7D73f4C5', //kucoin
  '0xa03400E098F4421b34a3a44A1B4e571419517687' //htx
];

export const CRON_PATTERN: string = process.env.CRON_PATTERN || '*/1 * * * *';

// Exchange mapping for wallet addresses
export const EXCHANGE_MAPPING: Record<string, string> = {
  '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe': 'Gate.io',
  '0xf2449A4DB678Fe88b130faB68D7a90FB5Ff884a7': 'Gate.io',
  '0x58edF78281334335EfFa23101bBe3371b6a36A51': 'KuCoin',
  '0x9021069cE6842Ac73D824941F841810E7D73f4C5': 'KuCoin',
  '0xa03400E098F4421b34a3a44A1B4e571419517687': 'HTX'
};

// Helper function to get exchange label for a wallet address
export const getExchangeLabel = (walletAddress: string): string => {
  return EXCHANGE_MAPPING[walletAddress] || 'Unknown';
};

// Helper function to aggregate balances by exchange
export const aggregateBalancesByExchange = (balances: any[]): Record<string, any> => {
  const aggregated: Record<string, any> = {};
  
  balances.forEach(balance => {
    const exchangeLabel = getExchangeLabel(balance.wallet_address);
    const key = `${exchangeLabel}-${balance.network_name}`;
    
    if (!aggregated[key]) {
      aggregated[key] = {
        exchange_label: exchangeLabel,
        network_name: balance.network_name,
        network_symbol: balance.network_symbol,
        is_native: balance.is_native,
        total_balance: BigNumber.from(0),
        wallet_count: 0,
        wallets: []
      };
    }
    
    try {
      aggregated[key].total_balance = aggregated[key].total_balance.add(BigNumber.from(balance.balance));
      aggregated[key].wallet_count += 1;
      aggregated[key].wallets.push({
        wallet_address: balance.wallet_address,
        wallet_label: balance.wallet_label,
        balance: balance.balance
      });
    } catch (error) {
      logger.warn(`Invalid balance format for aggregation: ${balance.balance}`);
    }
  });
  
  // Convert BigNumber back to string for response
  Object.values(aggregated).forEach((agg: any) => {
    agg.total_balance = agg.total_balance.toString();
  });
  
  return aggregated;
};
