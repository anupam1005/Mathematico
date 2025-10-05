require('dotenv').config({ path: `${__dirname}/../config.env` });
const { connectToDatabase, ensureDatabaseConnection } = require('../utils/database');
const mongoose = require('mongoose');

const testDatabaseConnection = async () => {
  try {
    console.log('🚀 Testing database connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    // Test direct connection
    console.log('\n🔗 Testing direct connection...');
    const connection = await connectToDatabase();
    
    if (connection) {
      console.log('✅ Direct connection successful');
      console.log('Connection state:', mongoose.connection.readyState);
      console.log('Connection name:', mongoose.connection.name);
      console.log('Connection host:', mongoose.connection.host);
      console.log('Connection port:', mongoose.connection.port);
    } else {
      console.log('❌ Direct connection failed');
    }
    
    // Test ensure connection
    console.log('\n🔗 Testing ensure connection...');
    const isConnected = await ensureDatabaseConnection();
    
    if (isConnected) {
      console.log('✅ Ensure connection successful');
    } else {
      console.log('❌ Ensure connection failed');
    }
    
    // Test a simple database operation
    console.log('\n📝 Testing database operation...');
    const User = require('../models/User');
    
    // Try to count users
    const userCount = await User.countDocuments();
    console.log('✅ User count:', userCount);
    
    console.log('\n🎉 Database connection test successful!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔗 Database connection closed');
    }
  }
};

testDatabaseConnection();
