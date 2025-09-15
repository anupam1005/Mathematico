const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function testDatabaseConnection() {
  console.log('🔍 Testing Railway MySQL Database Connection...');
  console.log('📊 Connection Details:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_DATABASE}`);
  console.log(`   Username: ${process.env.DB_USERNAME}`);
  console.log('');

  const connectionConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
      rejectUnauthorized: false, // Allow self-signed certificates
      ca: undefined
    },
    connectTimeout: 60000,
    charset: 'utf8mb4',
    timezone: 'Z'
  };

  try {
    console.log('🔄 Attempting to connect...');
    const connection = await mysql.createConnection(connectionConfig);
    
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as currentTime');
    console.log('✅ Test query successful:', rows[0]);
    
    // Check database version
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log('📋 MySQL Version:', versionRows[0].version);
    
    // List tables
    const [tableRows] = await connection.execute('SHOW TABLES');
    console.log('📋 Tables in database:', tableRows.length > 0 ? tableRows.map(row => Object.values(row)[0]) : 'No tables found');
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error Code:', error.code);
    console.error('   Error Message:', error.message);
    console.error('   SQL State:', error.sqlState);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Suggestion: Check if the Railway MySQL service is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Suggestion: Check username and password');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Suggestion: Check if the database exists');
    }
    
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection();
