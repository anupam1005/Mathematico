const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

// Database configuration - uses Railway credentials
const dbConfig = {
  host: process.env.DB_HOST || 'hopper.proxy.rlwy.net',
  port: parseInt(process.env.DB_PORT) || 46878,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'hSuamHEZBJuyqLSJkHUbAPTdIoyeTXIN',
  database: process.env.DB_DATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  ssl: {
    rejectUnauthorized: false
  }
};

async function addUserSettingsTable() {
  let connection;
  
  try {
    console.log('🔗 Connecting to Railway database...');
    console.log('Host:', dbConfig.host);
    console.log('Port:', dbConfig.port);
    console.log('Database:', dbConfig.database);
    
    const pool = mysql.createPool(dbConfig);
    connection = await pool.getConnection();
    console.log('✅ Connected to Railway database successfully\n');

    // Check if user_settings table already exists
    console.log('📋 Checking if user_settings table exists...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'user_settings'"
    );

    if (tables.length > 0) {
      console.log('⚠️  user_settings table already exists');
      console.log('🔄 Dropping existing table...');
      await connection.execute('DROP TABLE user_settings');
      console.log('✅ Dropped existing user_settings table\n');
    }

    // Create user_settings table
    console.log('📝 Creating user_settings table...');
    const createTableQuery = `
      CREATE TABLE user_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        
        -- Notification Settings
        push_notifications BOOLEAN DEFAULT TRUE,
        email_notifications BOOLEAN DEFAULT TRUE,
        course_updates BOOLEAN DEFAULT TRUE,
        live_class_reminders BOOLEAN DEFAULT TRUE,
        
        -- App Preferences
        dark_mode BOOLEAN DEFAULT FALSE,
        auto_play_videos BOOLEAN DEFAULT TRUE,
        download_quality ENUM('Low', 'Medium', 'High') DEFAULT 'High',
        language VARCHAR(10) DEFAULT 'en',
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY \`unique_user_settings\` (\`user_id\`),
        INDEX \`idx_user_settings_user_id\` (\`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableQuery);
    console.log('✅ user_settings table created successfully\n');

    // Verify table was created
    console.log('🔍 Verifying table structure...');
    const [columns] = await connection.execute(
      "DESCRIBE user_settings"
    );
    
    console.log('\n📊 Table Structure:');
    console.log('─'.repeat(80));
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null.padEnd(5)} | ${col.Key || 'N/A'}`);
    });
    console.log('─'.repeat(80));

    // Get count of existing users
    const [userCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM users'
    );
    console.log(`\n👥 Found ${userCount[0].count} existing users in the database`);

    // Create default settings for existing users
    if (userCount[0].count > 0) {
      console.log('🔄 Creating default settings for existing users...');
      
      await connection.execute(`
        INSERT INTO user_settings 
          (user_id, push_notifications, email_notifications, course_updates, 
           live_class_reminders, dark_mode, auto_play_videos, download_quality, language)
        SELECT 
          id, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, 'High', 'en'
        FROM users
        WHERE id NOT IN (SELECT user_id FROM user_settings)
      `);
      
      const [settingsCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM user_settings'
      );
      console.log(`✅ Created default settings for ${settingsCount[0].count} users\n`);
    }

    console.log('✨ Migration completed successfully!\n');
    console.log('📌 Summary:');
    console.log('   ✓ user_settings table created');
    console.log('   ✓ Foreign key to users table added');
    console.log('   ✓ Indexes created for performance');
    console.log('   ✓ Default settings created for existing users');
    console.log('\n🎉 Your Railway database is now updated with user settings support!');

    connection.release();
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error details:', error);
    
    if (connection) {
      connection.release();
    }
    
    process.exit(1);
  }
}

// Run migration
console.log('\n🚀 Starting User Settings Table Migration');
console.log('=' .repeat(80));
console.log('This will add the user_settings table to your Railway database');
console.log('=' .repeat(80) + '\n');

addUserSettingsTable();

