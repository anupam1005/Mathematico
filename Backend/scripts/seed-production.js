// Production Database Seeding Script
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedProductionData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not configured');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Import models
    const User = require('../models/User');
    
    // Create admin user if not exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mathematico.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const admin = new User({
        name: 'Mathematico Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        is_admin: true,
        email_verified: true,
        is_active: true
      });
      
      await admin.save();
      console.log('✅ Admin user created successfully');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create indexes for better performance
    await User.createIndexes();
    console.log('✅ Database indexes created');

    console.log('🎉 Production data seeding completed');
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedProductionData();
}

module.exports = seedProductionData;
