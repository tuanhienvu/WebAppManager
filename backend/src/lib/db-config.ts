import { config as loadEnv } from 'dotenv';

loadEnv();

// Support DB2_* variables for MatBao hosting
if (!process.env.DATABASE_URL && process.env.DB2_HOST) {
  const dbHost = process.env.DB2_HOST || 'localhost';
  const dbPort = process.env.DB2_PORT || '3306';
  const dbName = process.env.DB2_NAME || '';
  const dbUser = process.env.DB2_USER || '';
  const dbPassword = process.env.DB2_PASSWORD || '';
  
  if (dbName && dbUser && dbPassword) {
    // URL encode password to handle special characters
    const encodedPassword = encodeURIComponent(dbPassword);
    process.env.DATABASE_URL = `mysql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}`;
    console.log('✅ DATABASE_URL constructed from DB2_* variables');
  }
}

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set in environment');
}

