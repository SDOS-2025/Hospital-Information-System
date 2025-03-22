import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

config();

const isProd = process.env.NODE_ENV === 'production';
const rootDir = isProd ? 'dist' : 'src';
const fileExtension = isProd ? '.js' : '.ts';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'hospital_information_system',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities: [path.join(rootDir, 'models', `**/*${fileExtension}`)],
  migrations: [path.join(rootDir, 'db', 'migrations', `**/*${fileExtension}`)],
  subscribers: [],
});
