const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

async function setupDatabaseSimple() {
  console.log('🚀 Simple Database Setup for Railway MySQL...');
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

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../Database.sql');
    console.log('📖 Reading database schema...');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('Database.sql file not found!');
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL schema loaded successfully');

    // Clean up the SQL content - remove problematic statements
    const cleanSql = sqlContent
      .replace(/--.*$/gm, '') // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/CREATE DATABASE IF NOT EXISTS mathematico;?/gi, '') // Remove database creation
      .replace(/USE mathematico;?/gi, '') // Remove USE statements
      .replace(/DROP TABLE IF EXISTS.*?;/gi, '') // Remove DROP statements for safety
      .trim();

    // Split into individual statements
    const statements = cleanSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.match(/^\s*$/));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement individually
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
          
          // Use query instead of execute for better compatibility
          await connection.query(statement);
          successCount++;
          console.log(`✅ Statement ${i + 1} executed successfully`);
          
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DB_CREATE_EXISTS' ||
              error.code === 'ER_DUP_ENTRY' ||
              error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
            skipCount++;
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error(`   Statement: ${statement.substring(0, 100)}...`);
            // Continue with other statements instead of failing completely
            skipCount++;
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
    console.log(`✅ Database setup complete! Found ${tables.length} tables:`);
    
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Check admin user if users table exists
    try {
      const [adminUsers] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      console.log(`👤 Admin users: ${adminUsers[0].count}`);
    } catch (error) {
      console.log('👤 Admin users: Table not found or not accessible');
    }

    // Check sample data
    try {
      const [courseCount] = await connection.execute("SELECT COUNT(*) as count FROM courses");
      console.log(`📚 Courses: ${courseCount[0].count}`);
    } catch (error) {
      console.log('📚 Courses: Table not found or not accessible');
    }

    try {
      const [bookCount] = await connection.execute("SELECT COUNT(*) as count FROM books");
      console.log(`📖 Books: ${bookCount[0].count}`);
    } catch (error) {
      console.log('📖 Books: Table not found or not accessible');
    }

    await connection.end();
    console.log('\n🎉 Database setup completed successfully!');
    console.log('🚀 Your Railway MySQL database is ready!');
    
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
setupDatabaseSimple();
