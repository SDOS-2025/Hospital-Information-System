import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

// Load the appropriate .env file based on environment
const envPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: envPath });

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const rootDir = isProd ? 'dist' : 'src';
const fileExtension = isProd ? '.js' : '.ts';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'hospital_system',
  synchronize: isTest, // Only enable synchronize in test environment
  dropSchema: isTest, // Drop schema before sync in test environment
  logging: process.env.DB_LOGGING === 'true',
  entities: [path.join(__dirname, '..', 'models', '**/*{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations', '**/*{.ts,.js}')],
  subscribers: [],
});
