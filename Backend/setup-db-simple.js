const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  // Create a connection to the MySQL server
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '1234',
    multipleStatements: true
  });

  try {
    console.log('Setting up database...');
    
    // Read the Database.sql file
    const sqlFile = path.join(__dirname, '..', 'Database.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL file
    console.log('Creating database and tables...');
    await connection.query(sqlContent);
    
    console.log('Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set your environment variables in config.env file');
    console.log('2. Start the server: npm run dev');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

setupDatabase().catch(console.error);
