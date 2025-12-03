import { config as loadEnv } from 'dotenv';

loadEnv();

/**
 * Database Configuration with Primary and Fallback Support
 * 
 * Primary: DB_* variables → DATABASE_URL
 * Fallback: DB2_* variables → DATABASE_URL_FALLBACK
 * 
 * Prisma will automatically try primary first, then fallback if primary fails.
 */

// Helper function to construct database URL from connection variables
function constructDatabaseUrl(host: string, port: string, name: string, user: string, password: string): string {
  const encodedPassword = encodeURIComponent(password);
  return `mysql://${user}:${encodedPassword}@${host}:${port}/${name}`;
}

// Configure Primary Database (DB_* variables or DB2_* as fallback)
if (!process.env.DATABASE_URL) {
  // Try DB_* variables first
  let dbHost = process.env.DB_HOST;
  let dbPort = process.env.DB_PORT || '3306';
  let dbName = process.env.DB_NAME || '';
  let dbUser = process.env.DB_USER || '';
  let dbPassword = process.env.DB_PASSWORD || '';
  
  // If DB_* not set, use DB2_* as primary
  if (!dbHost && process.env.DB2_HOST) {
    dbHost = process.env.DB2_HOST;
    dbPort = process.env.DB2_PORT || dbPort;
    dbName = process.env.DB2_NAME || dbName;
    dbUser = process.env.DB2_USER || dbUser;
    dbPassword = process.env.DB2_PASSWORD || dbPassword;
  }
  
  if (dbHost && dbName && dbUser && dbPassword) {
    process.env.DATABASE_URL = constructDatabaseUrl(dbHost, dbPort, dbName, dbUser, dbPassword);
    const source = process.env.DB_HOST ? 'DB_*' : 'DB2_*';
    console.log(`✅ Primary DATABASE_URL constructed from ${source} variables`);
    console.log(`   Primary DB: ${dbHost}:${dbPort}/${dbName}`);
  }
}

// Configure Fallback Database (DB2_* variables, only if different from primary)
if (process.env.DB2_HOST && process.env.DB_HOST) {
  // Only set fallback if DB_* is primary and DB2_* is different
  const db2Host = process.env.DB2_HOST;
  const db2Port = process.env.DB2_PORT || '3306';
  const db2Name = process.env.DB2_NAME || '';
  const db2User = process.env.DB2_USER || '';
  const db2Password = process.env.DB2_PASSWORD || '';
  
  if (db2Host && db2Name && db2User && db2Password) {
    const fallbackUrl = constructDatabaseUrl(db2Host, db2Port, db2Name, db2User, db2Password);
    
    // Only set as fallback if it's different from primary
    if (process.env.DATABASE_URL && process.env.DATABASE_URL !== fallbackUrl) {
      process.env.DATABASE_URL_FALLBACK = fallbackUrl;
      console.log('✅ Fallback DATABASE_URL_FALLBACK constructed from DB2_* variables');
      console.log(`   Fallback DB: ${db2Host}:${db2Port}/${db2Name}`);
    }
  }
}

// Validation
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set. Please configure DB_* variables for primary database.');
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL_FALLBACK) {
  console.log('🔀 Database fallback configured: Will try primary first, then fallback if connection fails.');
}

