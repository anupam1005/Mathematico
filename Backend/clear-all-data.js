const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearAllData() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    console.log('Connected to database successfully');

    // Clear all data from tables
    console.log('Clearing all data...');
    
    // Delete all books
    await connection.execute('DELETE FROM books');
    console.log('✅ All books deleted');
    
    // Delete all users (except admin)
    await connection.execute('DELETE FROM users WHERE email != ?', ['dc2006089@gmail.com']);
    console.log('✅ All users deleted (except admin)');
    
    // Reset auto-increment counters
    await connection.execute('ALTER TABLE books AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    console.log('✅ Auto-increment counters reset');
    
    console.log('🎉 All data cleared successfully!');
    
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

clearAllData();
