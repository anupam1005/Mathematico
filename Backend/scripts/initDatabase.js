const mongoose = require('mongoose');
const User = require('../models/User');

// Database initialization script
const initDatabase = async () => {
  try {
    console.log('🔗 Initializing database connection...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://anupamdas0515_db_user:8bO4aEEQ2TYAfCSu@mathematico-app.vszbcc9.mongodb.net/test?retryWrites=true&w=majority&appName=Mathematico-app';
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: 'majority',
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000
    };

    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, options);
    
    console.log('✅ Database connected successfully');
    console.log('📊 Connection state:', mongoose.connection.readyState);
    console.log('🏠 Host:', mongoose.connection.host);
    console.log('📝 Database:', mongoose.connection.name);
    
    // Test database operations
    console.log('🧪 Testing database operations...');
    
    // Test user creation
    try {
      const testUser = await User.createUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });
      console.log('✅ Test user created:', testUser.name);
      
      // Clean up test user
      await User.findByIdAndDelete(testUser._id);
      console.log('✅ Test user cleaned up');
      
    } catch (userError) {
      console.log('⚠️ User creation test failed (might already exist):', userError.message);
    }
    
    // Test user retrieval
    try {
      const userCount = await User.countDocuments();
      console.log('✅ User count:', userCount);
    } catch (countError) {
      console.log('⚠️ User count failed:', countError.message);
    }
    
    console.log('🎉 Database initialization completed successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
};

// Run initialization if called directly
if (require.main === module) {
  initDatabase()
    .then((success) => {
      if (success) {
        console.log('✅ Database setup completed');
        process.exit(0);
      } else {
        console.log('❌ Database setup failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Database setup error:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };
