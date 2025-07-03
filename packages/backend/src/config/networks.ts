import dotenv from 'dotenv';
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
  '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
  '0xf2449A4DB678Fe88b130faB68D7a90FB5Ff884a7',
  '0x58edF78281334335EfFa23101bBe3371b6a36A51',
  '0x9021069cE6842Ac73D824941F841810E7D73f4C5',
  '0xa03400E098F4421b34a3a44A1B4e571419517687'
];

export const CRON_PATTERN: string = process.env.CRON_PATTERN || '*/10 * * * *';
