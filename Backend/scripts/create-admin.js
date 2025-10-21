// Script to create an admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: `${__dirname}/../config.env` });

// Import User model
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://smartfarm:mathematico@mathematico.sod8pgp.mongodb.net/mathematico?retryWrites=true&w=majority';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@mathematico.com',
      password: 'AdminPass@2024', // Strong password
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      email_verified: true,
      is_admin: true,
      isAdmin: true
    };

    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@mathematico.com');
    console.log('🔑 Password: AdminPass@2024');
    console.log('👤 Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
createAdminUser();
