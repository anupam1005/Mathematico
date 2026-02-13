// Database Backup Script for Production
const mongoose = require('mongoose');
require('dotenv').config();

const backupDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not configured');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    const collections = mongoose.connection.collections;
    const backup = {};
    
    for (const name in collections) {
      const collection = collections[name];
      const docs = await collection.find({}).toArray();
      backup[name] = docs;
      console.log(`📦 Backed up ${docs.length} documents from ${name}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fs = require('fs');
    const path = require('path');
    
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup saved to ${backupFile}`);
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  backupDatabase();
}

module.exports = backupDatabase;
