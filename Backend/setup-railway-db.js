const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function setupRailwayDatabase() {
  console.log('🚀 Setting up Railway MySQL Database...');
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
      rejectUnauthorized: false
    },
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
  };

  try {
    console.log('🔄 Connecting to Railway MySQL...');
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected successfully!');

    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📋 Found ${tables.length} tables in the database`);

    if (tables.length === 0) {
      console.log('⚠️  No tables found. You may need to run migrations.');
      console.log('💡 Run: npm run db:setup');
    } else {
      console.log('📋 Existing tables:');
      tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    }

    // Test basic operations
    console.log('🧪 Testing basic database operations...');
    
    // Test INSERT (if users table exists)
    const [userTables] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (userTables.length > 0) {
      console.log('✅ Users table exists');
    } else {
      console.log('⚠️  Users table not found - migrations may be needed');
    }

    await connection.end();
    console.log('✅ Database setup check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error('   Error Code:', error.code);
    console.error('   Error Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Suggestion: Check if Railway MySQL service is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Suggestion: Check username and password');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Suggestion: Check if the database exists');
    }
    
    process.exit(1);
  }
}

// Run the setup
setupRailwayDatabase();
