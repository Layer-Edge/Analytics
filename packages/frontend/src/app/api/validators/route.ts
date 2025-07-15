import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Validator API configuration
const VALIDATOR_API_CONFIG = {
  baseUrl: 'https://validator-stats.layeredge.io/api/v1/validators',
  timeout: 10000 // 10 seconds
};

// Helper to get validator data
async function getValidatorData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VALIDATOR_API_CONFIG.timeout);

    const response = await fetch(VALIDATOR_API_CONFIG.baseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('API returned unsuccessful response');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching validator data:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const validatorData = await getValidatorData();
    
    return NextResponse.json({
      validators: validatorData.validators,
      totalValidators: validatorData.total_validators,
      successfulFetches: validatorData.successful_fetches,
      timestamp: validatorData.timestamp
    });
  } catch (error) {
    console.error('Error fetching validator data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validator data' },
      { status: 500 }
    );
  }
} 