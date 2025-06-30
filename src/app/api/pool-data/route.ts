import { NextRequest, NextResponse } from 'next/server';
import { fetchPoolData } from '@/utils/graphql';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('poolId');
    const dex = searchParams.get('dex');

    if (!poolId) {
      return NextResponse.json(
        { error: 'Pool ID is required' },
        { status: 400 }
      );
    }

    if (dex === 'uniswap') {
      // Fetch real-time data from Uniswap subgraph
      const data = await fetchPoolData(poolId);
      return NextResponse.json(data);
    } else {
      // Return mock data for PancakeSwap (or other DEX)
      // This can be replaced with actual PancakeSwap API calls later
      return NextResponse.json({
        pool: {
          token0: {
            name: "LayerEdge",
            symbol: "EDGEN",
            totalSupply: "1000000000000000000000000000",
            totalValueLockedUSD: "464006.2775147078345348636855783133",
            txCount: "5173"
          },
          token1: {
            name: "Wrapped Ether",
            symbol: "WETH",
            totalSupply: "19848",
            totalValueLockedUSD: "1563232220.583618192111588578014656",
            txCount: "79315915"
          },
          volumeUSD: "3325519.270879856552099863191188295",
          volumeToken0: "200162698.915842506548553685",
          volumeToken1: "1305.436162968270303171",
          collectedFeesToken0: "0",
          collectedFeesToken1: "0",
          untrackedVolumeUSD: "3323369.607801120007422838726850034",
          poolDayData: [
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20241",
              tvlUSD: "1424705.84024577858306918624275511",
              volumeUSD: "1227827.152235348839775169730497362"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20242",
              tvlUSD: "1296409.657789413992748582093632955",
              volumeUSD: "266223.7965622252964996108480787965"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20243",
              tvlUSD: "1254178.53635570357801880312906058",
              volumeUSD: "169307.6088549367811857102958710047"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20244",
              tvlUSD: "1063752.308971959640930595364004635",
              volumeUSD: "259661.4751257522786168584608823455"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20245",
              tvlUSD: "1089532.361186147037759707943794281",
              volumeUSD: "49520.54409178775552021051079683987"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20246",
              tvlUSD: "1052207.221008632414409651917977248",
              volumeUSD: "43211.41733488766330926768002234541"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20247",
              tvlUSD: "1085755.49853634139705457129542818",
              volumeUSD: "291483.8202447896581778704151354807"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20248",
              tvlUSD: "1223308.518749134026492216752425641",
              volumeUSD: "155010.485215624545199820372208691"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20249",
              tvlUSD: "1205528.3898774745991812153585057",
              volumeUSD: "75145.3524414164903888753868884086"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20250",
              tvlUSD: "1128468.813618110429324351794539486",
              volumeUSD: "30228.73005348641253676891053859605"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20251",
              tvlUSD: "1031548.135960203672388166214823905",
              volumeUSD: "51511.40944720518184871997377697248"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20252",
              tvlUSD: "994094.7487549720146634815425889888",
              volumeUSD: "198824.0133350418421000198448760888"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20253",
              tvlUSD: "949489.1163114951629384869999096024",
              volumeUSD: "33961.87849034527274846011092269705"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20254",
              tvlUSD: "946385.8673899452791292186604452629",
              volumeUSD: "12546.76033973747859675308695003841"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20255",
              tvlUSD: "1090645.378661504265766972417446556",
              volumeUSD: "294046.1305574420855744850377397289"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20256",
              tvlUSD: "984467.4237790839930934333080009601",
              volumeUSD: "92003.39521005758752420231973274208"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20257",
              tvlUSD: "948321.4603542270381173396804096851",
              volumeUSD: "68137.91433325502394959317310659668"
            },
            {
              id: "0x4b2c930f88a87d1bffac291b6a7e01c9f13dd03e-20258",
              tvlUSD: "934462.1649721975584124572626135526",
              volumeUSD: "6867.387006516358547467033163567163"
            }
          ],
          liquidityProviderCount: "0",
          feeTier: "10000",
          feesUSD: "33255.19270879856552099863191188295",
          collectedFeesUSD: "0",
          token0Price: "266896.593601204305453757287487882",
          token1Price: "0.000003746769437957666557239629211088652"
        }
      });
    }
  } catch (error) {
    console.error('Error fetching pool data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pool data' },
      { status: 500 }
    );
  }
} 