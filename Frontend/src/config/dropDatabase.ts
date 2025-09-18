import { config } from 'dotenv';
import * as mysql from 'mysql2/promise';

// Load environment variables
config();

async function dropDatabase() {
  try {
    const dbName = process.env.DB_DATABASE || 'mathematico';
    
    // Create a connection to MySQL server (without specifying a database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    // Drop the database
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    console.log(`Database '${dbName}' dropped successfully.`);
    
    // Close the connection
    await connection.end();
    
  } catch (error) {
    console.error('Error dropping database:', error);
    process.exit(1);
  }
}

dropDatabase();
