const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

async function setupCompleteDatabase() {
  console.log('🚀 Complete Database Setup for Railway MySQL...');
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
    multipleStatements: true,
    charset: 'utf8mb4',
    timezone: 'Z'
  };

  try {
    console.log('🔄 Connecting to Railway MySQL...');
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected successfully!');

    // Check MySQL version
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log('📋 MySQL Version:', versionRows[0].version);

    // Read and execute the complete SQL schema
    const sqlFilePath = path.join(__dirname, '../Database.sql');
    console.log('📖 Reading complete database schema...');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('Database.sql file not found!');
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL schema loaded successfully');

    // Clean up the SQL content
    const cleanSql = sqlContent
      .replace(/--.*$/gm, '') // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/CREATE DATABASE IF NOT EXISTS mathematico;?/gi, '') // Remove database creation
      .replace(/USE mathematico;?/gi, '') // Remove USE statements
      .trim();

    // Split into individual statements
    const statements = cleanSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.match(/^\s*$/));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
          await connection.execute(statement);
          successCount++;
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DB_CREATE_EXISTS' ||
              error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
            skipCount++;
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error(`   Statement: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    }

    console.log(`\n📊 Execution Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skipCount}`);
    console.log(`   📋 Total: ${statements.length}`);

    // Verify database setup
    console.log('\n🔍 Verifying database setup...');
    
    // Check tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Database setup complete! Created ${tables.length} tables:`);
    
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Check admin user
    const [adminUsers] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    console.log(`👤 Admin users: ${adminUsers[0].count}`);

    // Check sample data
    const [courseCount] = await connection.execute("SELECT COUNT(*) as count FROM courses");
    console.log(`📚 Courses: ${courseCount[0].count}`);

    const [bookCount] = await connection.execute("SELECT COUNT(*) as count FROM books");
    console.log(`📖 Books: ${bookCount[0].count}`);

    await connection.end();
    console.log('\n🎉 Complete database setup finished successfully!');
    console.log('🚀 Your Railway MySQL database is ready for the application!');
    
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

// Run the complete setup
setupCompleteDatabase();
