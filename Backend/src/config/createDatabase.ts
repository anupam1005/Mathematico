import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as mysql from 'mysql2/promise';
import { AppDataSource } from './data-source';

// Load environment variables
config();

async function createDatabase() {
  try {
    const dbName = process.env.DB_DATABASE || 'mathematico';
    
    // Create a connection to MySQL server (without specifying a database)
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    // Create the database if it doesn't exist
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Database '${dbName}' created or already exists.`);
    
    // Close the temporary connection
    await tempConnection.end();
    
    // Initialize the data source to verify the connection
    const dataSource = new DataSource({
      ...AppDataSource.options as any, // Type assertion to avoid type issues
      database: dbName,
      synchronize: false,
      logging: false,
    });
    
    await dataSource.initialize();
    console.log('Database connection successful!');
    await dataSource.destroy();
    
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  }
}

createDatabase();
