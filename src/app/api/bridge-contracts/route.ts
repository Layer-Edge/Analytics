// src/app/api/bridge-contracts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Chain configurations
const CHAIN_CONFIGS = {
  ethereum: {
    name: 'Ethereum',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    contracts: {
      edgenToken: '0xaa9806c938836627ed1a41ae871c7e1889ae02ca',
      mailboxEdgen: '0xB8bB85FD0836691a64aFc23199566F898a1d6f4a',
      mailboxWeth: '0xBeD6af5a688aC3F535d4E352D40d2ae67D22Ef24',
      hook: '0x13113bD4429735a0e7C398e455f7B39f35e38B52'
    }
  },
  binance: {
    name: 'Binance Smart Chain',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc.llamarpc.com',
    explorerUrl: 'https://bscscan.com',
    contracts: {
      edgenTokenAndMailbox: '0x0C808F0464C423d5Ea4F4454fcc23B6E2Ae75562',
      hook: '0x2E49dA0Dc6BFac19f522Da4a5379dFf4caFA3B34'
    }
  },
  edgenchain: {
    name: 'EdgeChain',
    rpcUrl: process.env.EDGENCHAIN_RPC_URL || 'https://rpc.layeredge.io',
    explorerUrl: 'https://edgenscan.io',
    contracts: {
      mailboxEdgen: '0x22EacED1774e0e24D6F4c3b1e593488Be21Ac34f',
      mailboxWeth: '0x4B0B28523e239A518Be03A0957299FBE87fa353C',
      hook: '0x8BADAAcD60824c5Db01e9C3616e4906Ca90B7C02'
    }
  }
};

const RELAYER_ADDRESS = '0x3cd1bdcbb5032086C93eAf39b0A88909638A544a';

// Helper to get native balance using ethers
async function getNativeBalance(rpcUrl: string, address: string) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    // Return as float (ETH, BNB, etc.)
    return parseFloat(ethers.formatEther(balance));
  } catch (error) {
    console.error('Error getting native balance:', error);
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');

    if (chain && CHAIN_CONFIGS[chain as keyof typeof CHAIN_CONFIGS]) {
      // Return data for specific chain
      const config = CHAIN_CONFIGS[chain as keyof typeof CHAIN_CONFIGS];
      return NextResponse.json(await getChainData(config));
    }

    // Return data for all chains and relayer
    const allChainData = await Promise.all(
      Object.entries(CHAIN_CONFIGS).map(async ([chainKey, config]) => ({
        chain: chainKey,
        ...await getChainData(config)
      }))
    );

    const relayer = {
      address: RELAYER_ADDRESS,
      balances: await getRelayerBalances()
    };

    return NextResponse.json({
      chains: allChainData,
      relayer
    });
  } catch (error) {
    console.error('Error fetching bridge contract data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bridge contract data' },
      { status: 500 }
    );
  }
}

// Only fetch native balances for relayer
async function getRelayerBalances() {
  return {
    ethereum: await getNativeBalance(CHAIN_CONFIGS.ethereum.rpcUrl, RELAYER_ADDRESS),
    binance: await getNativeBalance(CHAIN_CONFIGS.binance.rpcUrl, RELAYER_ADDRESS),
    edgenchain: await getNativeBalance(CHAIN_CONFIGS.edgenchain.rpcUrl, RELAYER_ADDRESS)
  };
}

async function getChainData(config: any) {
  const { name, rpcUrl, explorerUrl, contracts } = config;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const result: any = { name, explorerUrl, contracts: {} };

  // Ethereum
  if (name === 'Ethereum') {
    // edgenToken (ERC20)
    result.contracts.edgenToken = {
      address: contracts.edgenToken,
      balance: await getERC20Balance(provider, contracts.edgenToken, RELAYER_ADDRESS)
    };
    // mailboxEdgen (native balance)
    result.contracts.mailboxEdgen = {
      address: contracts.mailboxEdgen,
      balance: await getNativeBalance(rpcUrl, contracts.mailboxEdgen),
      hook: contracts.hook,
      interchainSecurityModule: '0x' + '0'.repeat(40),
      owner: '0x1234567890123456789012345678901234567890',
      domains: [1, 56, 1338]
    };
    // mailboxWeth (native balance)
    result.contracts.mailboxWeth = {
      address: contracts.mailboxWeth,
      balance: await getNativeBalance(rpcUrl, contracts.mailboxWeth),
      hook: contracts.hook,
      interchainSecurityModule: '0x' + '0'.repeat(40),
      owner: '0x1234567890123456789012345678901234567890',
      domains: [1, 56, 1338]
    };
    // hook (native balance)
    result.contracts.hook = {
      address: contracts.hook,
      nativeBalance: await getNativeBalance(rpcUrl, contracts.hook)
    };
  } else if (name === 'Binance Smart Chain') {
    // edgenTokenAndMailbox (ERC20)
    result.contracts.edgenTokenAndMailbox = {
      address: contracts.edgenTokenAndMailbox,
      balance: await getERC20Balance(provider, contracts.edgenTokenAndMailbox, RELAYER_ADDRESS),
      hook: contracts.hook,
      interchainSecurityModule: '0x' + '0'.repeat(40),
      owner: '0x1234567890123456789012345678901234567890',
      domains: [1, 56, 1338]
    };
    // hook (native balance)
    result.contracts.hook = {
      address: contracts.hook,
      nativeBalance: await getNativeBalance(rpcUrl, contracts.hook)
    };
  } else { // EdgeChain
    // mailboxEdgen (native balance)
    result.contracts.mailboxEdgen = {
      address: contracts.mailboxEdgen,
      balance: await getNativeBalance(rpcUrl, contracts.mailboxEdgen),
      hook: contracts.hook,
      interchainSecurityModule: '0x' + '0'.repeat(40),
      owner: '0x1234567890123456789012345678901234567890',
      domains: [1, 56, 1338]
    };
    // mailboxWeth (native balance)
    result.contracts.mailboxWeth = {
      address: contracts.mailboxWeth,
      balance: await getNativeBalance(rpcUrl, contracts.mailboxWeth),
      hook: contracts.hook,
      interchainSecurityModule: '0x' + '0'.repeat(40),
      owner: '0x1234567890123456789012345678901234567890',
      domains: [1, 56, 1338]
    };
    // hook (native balance)
    result.contracts.hook = {
      address: contracts.hook,
      edgenBalance: await getNativeBalance(rpcUrl, contracts.hook)
    };
  }
  return result;
}

// Helper to get ERC20 balance
async function getERC20Balance(provider: any, contractAddress: string, holder: string) {
  const abi = ["function balanceOf(address) view returns (uint256)"];
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const balance = await contract.balanceOf(holder);
  return parseFloat(ethers.formatUnits(balance, 18));
}