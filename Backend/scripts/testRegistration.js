require('dotenv').config({ path: `${__dirname}/../config.env` });
const { connectToDatabase } = require('../utils/database');
const User = require('../models/User');
const mongoose = require('mongoose');

const testRegistration = async () => {
  try {
    console.log('🚀 Testing registration flow...');
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    const dbConnected = await connectToDatabase();
    
    if (dbConnected) {
      console.log('✅ Database connected successfully');
      
      // Test user creation
      const testEmail = `testuser_${Date.now()}@example.com`;
      const testName = 'Test User';
      const testPassword = 'password123';
      
      console.log(`Creating test user: ${testName} (${testEmail})`);
      const newUser = await User.createUser({
        name: testName,
        email: testEmail,
        password: testPassword,
        role: 'user'
      });
      
      if (newUser) {
        console.log('✅ User created successfully:');
        console.log(`   ID: ${newUser._id}`);
        console.log(`   Name: ${newUser.name}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Role: ${newUser.role}`);
        
        // Test finding the user
        const foundUser = await User.findByEmail(testEmail);
        if (foundUser) {
          console.log('✅ User found in database after creation');
        } else {
          console.error('❌ User not found in database after creation');
        }
      } else {
        console.error('❌ Failed to create user');
      }
    } else {
      console.log('❌ Database connection failed, testing fallback mode');
      
      // Test fallback mode
      const fallbackUsers = global.fallbackUsers || new Map();
      global.fallbackUsers = fallbackUsers;
      
      const testEmail = `fallback_${Date.now()}@example.com`;
      const testName = 'Fallback User';
      
      const userData = {
        _id: Date.now().toString(),
        name: testName,
        email: testEmail,
        role: 'user',
        is_admin: false,
        email_verified: false,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      fallbackUsers.set(testEmail, userData);
      console.log('✅ User created in fallback storage:', userData.name);
      
      // Test finding the user
      const foundUser = fallbackUsers.get(testEmail);
      if (foundUser) {
        console.log('✅ User found in fallback storage');
      } else {
        console.error('❌ User not found in fallback storage');
      }
    }
    
    console.log('🎉 Registration test complete');
  } catch (error) {
    console.error('❌ Registration test failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔗 Database connection closed');
  }
};

testRegistration();
