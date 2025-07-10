import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = searchParams.get('page') || '1';
		const limit = searchParams.get('limit') || '100';
		const networkNames = searchParams.get('network_names') || 'ETH';

		// Construct the API URL with query parameters
		const apiUrl = `https://api.analytics.layeredge.io/api/balances/time-series?max_points=${limit}&page=${page}&network_names=${networkNames}`;

		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`API request failed with status: ${response.status}`);
		}

		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		console.error('Error fetching balance data:', error);
		return NextResponse.json(
			{ 
				success: false, 
				error: 'Failed to fetch balance data',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
