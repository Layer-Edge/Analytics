import { NextResponse } from 'next/server';

export async function GET() {
  // Sample data as provided by the user
  const sampleData = {
    "success": true,
    "chart_data": [
      {
        "timestamp": "2025-06-30T13:05:01.661Z",
        "balance": "5",
        "wallet_address": "0xCC844ddA1e986B92FD2D075bb05Ed21F509CA20c",
        "wallet_label": null,
        "network_name": "BSC",
        "network_symbol": "ERC20",
        "is_native": false,
        "block_number": "52387889"
      },
      {
        "timestamp": "2025-06-30T13:05:01.591Z",
        "balance": "91633686696613840543",
        "wallet_address": "0xCC844ddA1e986B92FD2D075bb05Ed21F509CA20c",
        "wallet_label": null,
        "network_name": "EDGEN",
        "network_symbol": "EDGEN",
        "is_native": true,
        "block_number": "502279"
      },
      {
        "timestamp": "2025-06-30T13:05:01.577Z",
        "balance": "341046514030244415699",
        "wallet_address": "0xa62162A652dE844510a694AE1F666930B3224CCA",
        "wallet_label": null,
        "network_name": "EDGEN",
        "network_symbol": "EDGEN",
        "is_native": true,
        "block_number": "502279"
      },
      {
        "timestamp": "2025-06-30T13:05:01.569Z",
        "balance": "1009999999999999989",
        "wallet_address": "0xCC844ddA1e986B92FD2D075bb05Ed21F509CA20c",
        "wallet_label": null,
        "network_name": "ETH",
        "network_symbol": "ERC20",
        "is_native": false,
        "block_number": "22817414"
      },
      {
        "timestamp": "2025-06-30T13:05:01.225Z",
        "balance": "510433524761187383711",
        "wallet_address": "0xa62162A652dE844510a694AE1F666930B3224CCA",
        "wallet_label": null,
        "network_name": "ETH",
        "network_symbol": "ERC20",
        "is_native": false,
        "block_number": "22817414"
      },
      {
        "timestamp": "2025-06-30T13:05:01.070Z",
        "balance": "1089210000000000005",
        "wallet_address": "0xa62162A652dE844510a694AE1F666930B3224CCA",
        "wallet_label": null,
        "network_name": "BSC",
        "network_symbol": "ERC20",
        "is_native": false,
        "block_number": "52387887"
      },
      {
        "timestamp": "2025-06-30T13:04:01.444Z",
        "balance": "341046514030244415699",
        "wallet_address": "0xa62162A652dE844510a694AE1F666930B3224CCA",
        "wallet_label": null,
        "network_name": "EDGEN",
        "network_symbol": "EDGEN",
        "is_native": true,
        "block_number": "502268"
      },
      {
        "timestamp": "2025-06-30T13:04:01.438Z",
        "balance": "91633686696613840543",
        "wallet_address": "0xCC844ddA1e986B92FD2D075bb05Ed21F509CA20c",
        "wallet_label": null,
        "network_name": "EDGEN",
        "network_symbol": "EDGEN",
        "is_native": true,
        "block_number": "502268"
      },
      {
        "timestamp": "2025-06-30T13:04:01.301Z",
        "balance": "510433524761187383711",
        "wallet_address": "0xa62162A652dE844510a694AE1F666930B3224CCA",
        "wallet_label": null,
        "network_name": "ETH",
        "network_symbol": "ERC20",
        "is_native": false,
        "block_number": "22817409"
      },
      {
        "timestamp": "2025-06-30T13:04:01.203Z",
        "balance": "1089210000000000005",
        "wallet_address": "0xa62162A652dE844510a694AE1F666930B3224CCA",
        "wallet_label": null,
        "network_name": "BSC",
        "network_symbol": "ERC20",
        "is_native": false,
        "block_number": "52387807"
      }
    ],
    "time_series": [
      {
        "wallet_address": "0xCC844ddA1e986B92FD2D075bb05Ed21F509CA20c",
        "wallet_label": null,
        "network_name": "BSC",
        "network_symbol": "ERC20",
        "is_native": false,
        "data_points": [
          {
            "timestamp": "2025-06-30T13:05:01.661Z",
            "balance": "5",
            "block_number": "52387889"
          },
          {
            "timestamp": "2025-06-30T13:04:01.078Z",
            "balance": "5",
            "block_number": "52387807"
          },
          {
            "timestamp": "2025-06-30T12:47:00.607Z",
            "balance": "5",
            "block_number": "52386447"
          },
          {
            "timestamp": "2025-06-30T12:46:00.569Z",
            "balance": "5",
            "block_number": "52386367"
          },
          {
            "timestamp": "2025-06-30T12:45:01.498Z",
            "balance": "5",
            "block_number": "52386288"
          },
          {
            "timestamp": "2025-06-30T12:44:01.590Z",
            "balance": "5",
            "block_number": "52386208"
          },
          {
            "timestamp": "2025-06-30T12:43:01.285Z",
            "balance": "5",
            "block_number": "52386128"
          },
          {
            "timestamp": "2025-06-30T12:42:01.199Z",
            "balance": "5",
            "block_number": "52386048"
          }
        ]
      },
      {
        "wallet_address": "0xCC844ddA1e986B92FD2D075bb05Ed21F509CA20c",
        "wallet_label": null,
        "network_name": "EDGEN",
        "network_symbol": "EDGEN",
        "is_native": true,
        "data_points": [
          {
            "timestamp": "2025-06-30T13:05:01.591Z",
            "balance": "91633686696613840543",
            "block_number": "502279"
          },
          {
            "timestamp": "2025-06-30T13:04:01.438Z",
            "balance": "91633686696613840543",
            "block_number": "502268"
          },
          {
            "timestamp": "2025-06-30T12:47:01.444Z",
            "balance": "91633761721613840543",
            "block_number": "502076"
          },
          {
            "timestamp": "2025-06-30T12:46:01.455Z",
            "balance": "91633761721613840543",
            "block_number": "502065"
          },
          {
            "timestamp": "2025-06-30T12:45:02.284Z",
            "balance": "91633761721613840543",
            "block_number": "502054"
          },
          {
            "timestamp": "2025-06-30T12:44:03.113Z",
            "balance": "91633761721613840543",
            "block_number": "502043"
          },
          {
            "timestamp": "2025-06-30T12:43:02.054Z",
            "balance": "91633761721613840543",
            "block_number": "502032"
          },
          {
            "timestamp": "2025-06-30T12:42:01.955Z",
            "balance": "91633761721613840543",
            "block_number": "502020"
          },
          {
            "timestamp": "2025-06-30T12:41:01.158Z",
            "balance": "91633761721613840543",
            "block_number": "502009"
          }
        ]
      },
      {
        "wallet_address": "0xa62162A652dE844510a694AE1F666930B3224CCA",
        "wallet_label": null,
        "network_name": "EDGEN",
        "network_symbol": "EDGEN",
        "is_native": true,
        "data_points": [
          {
            "timestamp": "2025-06-30T13:05:01.577Z",
            "balance": "341046514030244415699",
            "block_number": "502279"
          },
          {
            "timestamp": "2025-06-30T13:04:01.444Z",
            "balance": "341046514030244415699",
            "block_number": "502268"
          },
          {
            "timestamp": "2025-06-30T12:47:01.442Z",
            "balance": "341046514030244415699",
            "block_number": "502076"
          },
          {
            "timestamp": "2025-06-30T12:46:01.418Z",
            "balance": "341046514030244415699",
            "block_number": "502065"
          },
          {
            "timestamp": "2025-06-30T12:45:02.286Z",
            "balance": "341046514030244415699",
            "block_number": "502054"
          },
          {
            "timestamp": "2025-06-30T12:44:03.100Z",
            "balance": "341046514030244415699",
            "block_number": "502043"
          },
          {
            "timestamp": "2025-06-30T12:43:02.072Z",
            "balance": "341046514030244415699",
            "block_number": "502032"
          },
          {
            "timestamp": "2025-06-30T12:42:02.020Z",
            "balance": "341046514030244415699",
            "block_number": "502020"
          },
          {
            "timestamp": "2025-06-30T12:41:01.158Z",
            "balance": "341046514030244415699",
            "block_number": "502009"
          }
        ]
      },
      {
        "wallet_address": "0xCC844ddA1e986B92FD2D075bb05Ed21F509CA20c",
        "wallet_label": null,
        "network_name": "ETH",
        "network_symbol": "ERC20",
        "is_native": false,
        "data_points": [
          {
            "timestamp": "2025-06-30T13:05:01.569Z",
            "balance": "1009999999999999989",
            "block_number": "22817414"
          },
          {
            "timestamp": "2025-06-30T13:04:01.120Z",
            "balance": "1009999999999999989",
            "block_number": "22817409"
          },
          {
            "timestamp": "2025-06-30T12:47:00.621Z",
            "balance": "1009999999999999989",
            "block_number": "22817325"
          },
          {
            "timestamp": "2025-06-30T12:46:00.572Z",
            "balance": "1009999999999999989",
            "block_number": "22817320"
          },
          {
            "timestamp": "2025-06-30T12:45:01.552Z",
            "balance": "1009999999999999989",
            "block_number": "22817315"
          },
          {
            "timestamp": "2025-06-30T12:44:02.179Z",
            "balance": "1009999999999999989",
            "block_number": "22817311"
          },
          {
            "timestamp": "2025-06-30T12:43:01.238Z",
            "balance": "1009999999999999989",
            "block_number": "22817305"
          },
          {
            "timestamp": "2025-06-30T12:42:01.214Z",
            "balance": "1009999999999999989",
            "block_number": "22817300"
          }
        ]
      },
      {
        "wallet_address": "0xa62162A652dE844510a694AE1F666930B3224CCA",
        "wallet_label": null,
        "network_name": "ETH",
        "network_symbol": "ERC20",
        "is_native": false,
        "data_points": [
          {
            "timestamp": "2025-06-30T13:05:01.225Z",
            "balance": "510433524761187383711",
            "block_number": "22817414"
          },
          {
            "timestamp": "2025-06-30T13:04:01.301Z",
            "balance": "510433524761187383711",
            "block_number": "22817409"
          },
          {
            "timestamp": "2025-06-30T12:47:00.570Z",
            "balance": "510433524761187383711",
            "block_number": "22817325"
          },
          {
            "timestamp": "2025-06-30T12:46:00.449Z",
            "balance": "510433524761187383711",
            "block_number": "22817320"
          },
          {
            "timestamp": "2025-06-30T12:45:01.508Z",
            "balance": "510433524761187383711",
            "block_number": "22817315"
          },
          {
            "timestamp": "2025-06-30T12:44:01.947Z",
            "balance": "510433524761187383711",
            "block_number": "22817311"
          },
          {
            "timestamp": "2025-06-30T12:43:01.166Z",
            "balance": "510433524761187383711",
            "block_number": "22817305"
          },
          {
            "timestamp": "2025-06-30T12:42:01.179Z",
            "balance": "510433524761187383711",
            "block_number": "22817300"
          }
        ]
      },
      {
        "wallet_address": "0xa62162A652dE844510a694AE1F666930B3224CCA",
        "wallet_label": null,
        "network_name": "BSC",
        "network_symbol": "ERC20",
        "is_native": false,
        "data_points": [
          {
            "timestamp": "2025-06-30T13:05:01.070Z",
            "balance": "1089210000000000005",
            "block_number": "52387887"
          },
          {
            "timestamp": "2025-06-30T13:04:01.203Z",
            "balance": "1089210000000000005",
            "block_number": "52387807"
          },
          {
            "timestamp": "2025-06-30T12:47:00.542Z",
            "balance": "1089210000000000005",
            "block_number": "52386447"
          },
          {
            "timestamp": "2025-06-30T12:46:00.480Z",
            "balance": "1089210000000000005",
            "block_number": "52386367"
          },
          {
            "timestamp": "2025-06-30T12:45:01.419Z",
            "balance": "1089210000000000005",
            "block_number": "52386288"
          },
          {
            "timestamp": "2025-06-30T12:44:01.591Z",
            "balance": "1089210000000000005",
            "block_number": "52386208"
          },
          {
            "timestamp": "2025-06-30T12:43:01.188Z",
            "balance": "1089210000000000005",
            "block_number": "52386128"
          },
          {
            "timestamp": "2025-06-30T12:42:01.139Z",
            "balance": "1089210000000000005",
            "block_number": "52386048"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 168,
      "totalPages": 4,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "start_date": "2024-01-01T00:00:00.000Z"
    }
  };

  return NextResponse.json(sampleData);
} 