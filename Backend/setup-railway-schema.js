const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

async function setupRailwaySchema() {
  console.log('🚀 Setting up Railway MySQL Database Schema...');
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
    acquireTimeout: 60000,
    timeout: 60000,
    multipleStatements: true, // Allow multiple SQL statements
    charset: 'utf8mb4',
    timezone: 'Z'
  };

  try {
    console.log('🔄 Connecting to Railway MySQL...');
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected successfully!');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../Database.sql');
    console.log('📖 Reading SQL schema file...');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('Database.sql file not found!');
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL file loaded successfully');

    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DB_CREATE_EXISTS') {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    // Verify tables were created
    console.log('🔍 Verifying database setup...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Database setup complete! Created ${tables.length} tables:`);
    
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Check if admin user exists
    const [adminUsers] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    console.log(`👤 Admin users: ${adminUsers[0].count}`);

    await connection.end();
    console.log('✅ Database schema setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database schema setup failed:');
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
setupRailwaySchema();
