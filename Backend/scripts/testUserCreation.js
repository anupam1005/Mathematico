const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: `${__dirname}/../config.env` });

// Test user creation in the users collection
const testUserCreation = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://anupamdas0515_db_user:8bO4aEEQ2TYAfCSu@mathematico-app.vszbcc9.mongodb.net/test?retryWrites=true&w=majority&appName=Mathematico-app';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: 'majority',
      connectTimeoutMS: 10000
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📝 Database:', mongoose.connection.name);
    console.log('🏠 Host:', mongoose.connection.host);
    
    // Test user creation
    console.log('🧪 Testing user creation...');
    
    const testUser = await User.createUser({
      name: 'Test User from Script',
      email: 'testuser@example.com',
      password: 'password123',
      role: 'user'
    });
    
    console.log('✅ User created successfully:');
    console.log('   - ID:', testUser._id);
    console.log('   - Name:', testUser.name);
    console.log('   - Email:', testUser.email);
    console.log('   - Role:', testUser.role);
    console.log('   - Created At:', testUser.createdAt);
    
    // Test user retrieval
    console.log('🔍 Testing user retrieval...');
    const retrievedUser = await User.findByEmail('testuser@example.com');
    
    if (retrievedUser) {
      console.log('✅ User retrieved successfully:');
      console.log('   - Name:', retrievedUser.name);
      console.log('   - Email:', retrievedUser.email);
      console.log('   - Role:', retrievedUser.role);
    } else {
      console.log('❌ User not found');
    }
    
    // Test user count
    const userCount = await User.countDocuments();
    console.log('📊 Total users in collection:', userCount);
    
    // List all users
    const allUsers = await User.find({}).select('name email role createdAt').limit(5);
    console.log('👥 Recent users:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.createdAt}`);
    });
    
    console.log('🎉 User creation test completed successfully');
    
    // Clean up test user
    await User.findByIdAndDelete(testUser._id);
    console.log('🧹 Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the test
testUserCreation();
