import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for CLI
dotenv.config({ path: path.join(__dirname, '../../config.env') });

const isProduction = process.env.NODE_ENV === 'production';

// CLI-compatible DataSource for TypeORM commands
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'mathematico',
  synchronize: false,
  migrationsRun: false, // Don't auto-run migrations in CLI
  logging: true, // Enable logging for CLI
  entities: [
    path.join(__dirname, '../entities/*{.ts,.js}'),
  ],
  migrations: [
    path.join(__dirname, '../migrations/*{.ts,.js}'),
  ],
  subscribers: [],
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    connectTimeout: 60000,
    charset: 'utf8mb4',
    timezone: 'Z',
  },
  ...(isProduction && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});
