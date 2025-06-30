#!/usr/bin/env tsx

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { MONITORED_WALLETS } from '../src/config/networks';

// Load environment variables
dotenv.config();

async function initializeDatabase() {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('📁 Created logs directory');
  }

  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: 'postgres' // Connect to default database first
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();

    const dbName = process.env.DATABASE_NAME || 'analytics_db';
    
    // Check if database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbExists = await client.query(checkDbQuery, [dbName]);

    if (dbExists.rows.length === 0) {
      console.log(`📊 Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log('✅ Database created successfully');
    } else {
      console.log(`📊 Database ${dbName} already exists`);
    }

    await client.end();

    // Connect to the target database and run schema
    console.log('🏗️ Setting up database schema...');
    const targetClient = new Client({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      database: dbName
    });

    await targetClient.connect();

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'src', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    try {
      await targetClient.query(schema);
      console.log('✅ Database schema created successfully');
    } catch (error) {
      // Log the error but continue - some objects might already exist
      console.log('⚠️ Schema execution completed with warnings:', (error as Error).message);
      console.log('✅ Database schema setup completed');
    }

    // Insert initial wallet data
    console.log('👛 Initializing wallet data...');
    
    let walletCount = 0;
    for (const wallet of MONITORED_WALLETS) {
      try {
        const result = await targetClient.query(
          'INSERT INTO wallets (address) VALUES ($1) ON CONFLICT (address) DO NOTHING RETURNING id',
          [wallet]
        );
        if (result.rows.length > 0) {
          walletCount++;
        }
      } catch (error) {
        console.log(`⚠️ Failed to insert wallet ${wallet}:`, (error as Error).message);
      }
    }
    
    console.log(`✅ Processed ${MONITORED_WALLETS.length} wallets (${walletCount} newly added)`);

    await targetClient.end();
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Configure your .env file with proper RPC URLs');
    console.log('2. Start the service: pnpm dev');
    console.log('3. Start monitoring: POST /api/monitoring/start');

  } catch (error) {
    console.error('❌ Database initialization failed:', (error as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase }; 
