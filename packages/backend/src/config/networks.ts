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
  '0xa62162A652dE844510a694AE1F666930B3224CCA',
  '0xCC844ddA1e986B92FD2D075bb05Ed21F509CA20c'
]; 
