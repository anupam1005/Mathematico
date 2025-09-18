import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Course } from '../entities/Course';
import { Module } from '../entities/Module';
import { Lesson } from '../entities/Lesson';
import { Enrollment } from '../entities/Enrollment';
import { UserProgress } from '../entities/UserProgress';
import { Setting } from '../entities/Setting';
import { RefreshToken } from '../entities/RefreshToken';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { Book } from '../entities/Book';
import { LiveClass } from '../entities/LiveClass';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from config.env
dotenv.config({ path: path.join(__dirname, '../../config.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Create a new DataSource instance
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_DATABASE || 'mathematico',
  synchronize: false, // Disable auto-sync to prevent schema changes
  migrationsRun: false, // Disable auto-running migrations for now
  logging: !isProduction, // Log SQL queries in development
  entities: [
    User,
    Course,
    Module,
    Lesson,
    Enrollment,
    UserProgress,
    Setting,
    RefreshToken,
    PasswordResetToken,
    Book,
    LiveClass,
  ],
  migrations: ['./src/migrations/*.ts'],
  subscribers: [],
  dropSchema: false, // Set to true to drop schema on each application launch (for development)
  extra: {
    connectionLimit: 10, // Connection pool size
  },
  // Enable SSL for Railway (both production and development)
  ssl: {
    rejectUnauthorized: false, // Set to false for self-signed certificates
  },
});




