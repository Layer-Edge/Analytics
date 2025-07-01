#!/usr/bin/env tsx

import { BalanceRepository } from './repositories/BalanceRepository';
import { PeriodicSampleFilters } from './models/types';
import { logger } from './utils/logger';

async function testPeriodicSamples() {
  const balanceRepository = new BalanceRepository();

  console.log('🚀 Testing Simplified Periodic Sampling\n');

  // Test 1: Get samples every 6 hours
  console.log('Test 1: 6-hour intervals with "last" position');
  const test1Filters: PeriodicSampleFilters = {
    network_names: ['ETH']
  };

  try {
    const result1 = await balanceRepository.getPeriodicBalanceSnapshotsFromActualData(
      6, // 6-hour intervals
      'last',
      test1Filters
    );
    
    console.log(`✅ Found ${result1.length} samples`);
    
    if (result1.length > 0) {
      const sample = result1[0];
      console.log(`📊 Total data timespan: ${sample.total_hours} hours`);
      console.log(`🎯 Expected periods: ${sample.expected_periods}`);
      console.log(`⏰ Data range: ${sample.first_timestamp} to ${sample.last_timestamp}`);
      
      console.log('\nSample data:');
      result1.slice(0, 3).forEach((sample, i) => {
        console.log(`  ${i + 1}. Period ${sample.period_index}: ${sample.wallet_address} on ${sample.network_name}`);
        console.log(`     Balance: ${sample.balance} at ${sample.timestamp}`);
        console.log(`     Period: ${sample.period_start} to ${sample.period_end}`);
      });
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Get time series data with dynamic intervals
  console.log('Test 2: Dynamic time series targeting 20 points');
  const test2Filters: PeriodicSampleFilters = {
    network_names: ['ETH', 'BSC']
  };

  try {
    const result2 = await balanceRepository.getTimeSeriesData(test2Filters, 20);
    
    console.log(`✅ Generated ${result2.length} time series points`);
    
    if (result2.length > 0) {
      const sample = result2[0];
      console.log(`📊 Total data timespan: ${sample.total_hours} hours`);
      console.log(`🎯 Expected periods: ${sample.expected_periods}`);
      
      console.log('\nTime series sample:');
      result2.slice(0, 5).forEach((point, i) => {
        console.log(`  ${i + 1}. ${point.timestamp}: ${point.wallet_address} = ${point.balance}`);
      });
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Compare first vs last position
  console.log('Test 3: Comparing "first" vs "last" position strategies');
  const test3Filters: PeriodicSampleFilters = {
    network_names: ['ETH']
  };

  try {
    const firstResult = await balanceRepository.getPeriodicBalanceSnapshotsFromActualData(
      12, // 12-hour intervals
      'first',
      test3Filters
    );
    
    const lastResult = await balanceRepository.getPeriodicBalanceSnapshotsFromActualData(
      12, // 12-hour intervals  
      'last',
      test3Filters
    );
    
    console.log(`✅ FIRST position: ${firstResult.length} samples`);
    console.log(`✅ LAST position: ${lastResult.length} samples`);
    
    if (firstResult.length > 0 && lastResult.length > 0) {
      console.log('\nComparison (same period):');
      const firstSample = firstResult[0];
      const lastSample = lastResult[0];
      
      console.log(`  First: ${firstSample.balance} at ${firstSample.timestamp}`);
      console.log(`  Last:  ${lastSample.balance} at ${lastSample.timestamp}`);
      console.log(`  Period: ${firstSample.period_start} to ${firstSample.period_end}`);
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  console.log('\n🎉 Periodic sampling testing completed!');
}

// Performance test function
async function performanceTest() {
  console.log('\n🔥 Performance Testing\n');
  
  const balanceRepository = new BalanceRepository();
  
  const filters: PeriodicSampleFilters = {};

  console.log('Testing query performance...');
  const startTime = Date.now();
  
  try {
    const result = await balanceRepository.getPeriodicBalanceSnapshotsFromActualData(
      6, // 6-hour intervals
      'last',
      filters
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Query completed in ${duration}ms`);
    console.log(`📊 Retrieved ${result.length} samples`);
    console.log(`🎯 Expected performance: <1000ms for periodic queries`);
    
    if (duration < 500) {
      console.log('🚀 Performance: EXCELLENT');
    } else if (duration < 1000) {
      console.log('⚡ Performance: GOOD');
    } else if (duration < 2000) {
      console.log('⚠️  Performance: ACCEPTABLE');
    } else {
      console.log('❌ Performance: NEEDS OPTIMIZATION');
    }
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
}

// Run tests
async function runTests() {
  try {
    await testPeriodicSamples();
    await performanceTest();
  } catch (error) {
    logger.error('Test execution failed:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  runTests();
} 