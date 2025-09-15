const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function fixMySQL94Issues() {
  console.log('🔧 Fixing MySQL 9.4.0 compatibility issues...');
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
      rejectUnauthorized: false,
      ca: undefined
    },
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    charset: 'utf8mb4',
    timezone: 'Z'
  };

  try {
    console.log('🔄 Connecting to Railway MySQL 9.4.0...');
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected successfully!');

    // Check MySQL version
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log('📋 MySQL Version:', versionRows[0].version);

    // Set MySQL 9.4.0 specific configurations
    console.log('🔧 Applying MySQL 9.4.0 compatibility fixes...');
    
    // Set SQL mode for compatibility
    await connection.execute("SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'");
    console.log('✅ SQL mode set for compatibility');

    // Set timezone
    await connection.execute("SET time_zone = '+00:00'");
    console.log('✅ Timezone set to UTC');

    // Check character set
    const [charsetRows] = await connection.execute("SELECT @@character_set_database as charset");
    console.log('📋 Database charset:', charsetRows[0].charset);

    // Test basic operations
    console.log('🧪 Testing basic operations...');
    
    // Test table creation
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS test_mysql94 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_data VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table creation test passed');

    // Test insert
    await connection.execute("INSERT INTO test_mysql94 (test_data) VALUES ('MySQL 9.4.0 test')");
    console.log('✅ Insert test passed');

    // Test select
    const [testRows] = await connection.execute("SELECT * FROM test_mysql94 WHERE test_data = 'MySQL 9.4.0 test'");
    console.log('✅ Select test passed:', testRows[0]);

    // Clean up test table
    await connection.execute("DROP TABLE IF EXISTS test_mysql94");
    console.log('✅ Test cleanup completed');

    await connection.end();
    console.log('✅ MySQL 9.4.0 compatibility fixes applied successfully!');
    
  } catch (error) {
    console.error('❌ MySQL 9.4.0 fix failed:');
    console.error('   Error Code:', error.code);
    console.error('   Error Message:', error.message);
    
    if (error.code === 'ER_NOT_SUPPORTED_AUTH_MODE') {
      console.log('💡 Suggestion: MySQL 9.4.0 uses new authentication, try updating mysql2 package');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Suggestion: Check username and password');
    }
    
    process.exit(1);
  }
}

// Run the fix
fixMySQL94Issues();
