import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Staking contract configuration
const STAKING_CONFIG = {
  contractAddress: '0x3935a7b8faefe80a6f91b0e061a36a49c2e3e782',
  rpcUrl: process.env.EDGENCHAIN_RPC_URL || 'https://rpc.layeredge.io',
  explorerUrl: 'https://edgenscan.io'
};

// Staking contract ABI (only the functions we need)
const STAKING_ABI = [
  {
    "inputs": [],
    "name": "getAllStakingInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "_totalStaked",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_stakerCountInTree",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_stakerCountOutOfTree",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_rewardsReserve",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minStakeAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_tier1Count",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_tier2Count",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_tier3Count",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalStakersCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "rank",
        "type": "uint256"
      }
    ],
    "name": "stakerAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "userAddr",
        "type": "address"
      }
    ],
    "name": "getUserInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "enum LayerEdgeStaking.Tier",
        "name": "tier",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "apy",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pendingRewards",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Helper to get staking contract data
async function getStakingContractData() {
  try {
    const provider = new ethers.JsonRpcProvider(STAKING_CONFIG.rpcUrl);
    const contract = new ethers.Contract(STAKING_CONFIG.contractAddress, STAKING_ABI, provider);

    // Get all staking info
    const stakingInfo = await contract.getAllStakingInfo();
    
    // Get total stakers count
    const totalStakersCount = await contract.getTotalStakersCount();

    // Get top stakers (first 10 by rank)
    const topStakers = [];
    const maxStakers = Math.min(10, Number(totalStakersCount));
    
    for (let i = 0; i < maxStakers; i++) {
      try {
        const stakerAddress = await contract.stakerAddress(i);
        const userInfo = await contract.getUserInfo(stakerAddress);
        
        topStakers.push({
          id: stakerAddress,
          totalStaked: userInfo.balance.toString(),
          currentTier: Number(userInfo.tier),
          pendingRewards: userInfo.pendingRewards.toString(),
          apy: userInfo.apy.toString(),
          rank: i + 1,
          isActive: true
        });
      } catch (error) {
        console.error(`Error fetching staker ${i}:`, error);
        // Continue with next staker
      }
    }

    return {
      totalStaked: stakingInfo._totalStaked.toString(),
      stakerCountInTree: stakingInfo._stakerCountInTree.toString(),
      stakerCountOutOfTree: stakingInfo._stakerCountOutOfTree.toString(),
      rewardsReserve: stakingInfo._rewardsReserve.toString(),
      minStakeAmount: stakingInfo._minStakeAmount.toString(),
      tier1Count: stakingInfo._tier1Count.toString(),
      tier2Count: stakingInfo._tier2Count.toString(),
      tier3Count: stakingInfo._tier3Count.toString(),
      totalStakersCount: totalStakersCount.toString(),
      topStakers
    };
  } catch (error) {
    console.error('Error fetching staking contract data:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const contractData = await getStakingContractData();
    
    return NextResponse.json({
      contract: {
        address: STAKING_CONFIG.contractAddress,
        explorerUrl: STAKING_CONFIG.explorerUrl,
        ...contractData
      }
    });
  } catch (error) {
    console.error('Error fetching staking contract data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staking contract data' },
      { status: 500 }
    );
  }
} 