#!/usr/bin/env node

/**
 * Clear All Content Script
 * Deletes all books, courses, live classes, and related data from the database
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearAllContent() {
  let connection;
  
  try {
    console.log('🗑️  Starting to clear all content from database...\n');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'hopper.proxy.rlwy.net',
      port: process.env.DB_PORT || 46878,
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'hSuamHEZBJuyqLSJkHUbAPTdIoyeTXIN',
      database: process.env.DB_DATABASE || 'railway',
      ssl: { rejectUnauthorized: false }
    });

    console.log('✅ Connected to database successfully\n');

    // Clear all content in the correct order (respecting foreign key constraints)
    console.log('1️⃣ Clearing enrollments (to avoid foreign key constraints)...');
    await connection.execute('DELETE FROM enrollments');
    console.log('   ✅ Enrollments cleared');

    console.log('\n2️⃣ Clearing user progress...');
    await connection.execute('DELETE FROM user_progress');
    console.log('   ✅ User progress cleared');

    console.log('\n3️⃣ Clearing lessons...');
    await connection.execute('DELETE FROM lessons');
    console.log('   ✅ Lessons cleared');

    console.log('\n4️⃣ Clearing modules...');
    await connection.execute('DELETE FROM modules');
    console.log('   ✅ Modules cleared');

    console.log('\n5️⃣ Clearing live classes...');
    await connection.execute('DELETE FROM live_classes');
    console.log('   ✅ Live classes cleared');

    console.log('\n6️⃣ Clearing courses...');
    await connection.execute('DELETE FROM courses');
    console.log('   ✅ Courses cleared');

    console.log('\n7️⃣ Clearing books...');
    await connection.execute('DELETE FROM books');
    console.log('   ✅ Books cleared');

    console.log('\n8️⃣ Clearing refresh tokens...');
    await connection.execute('DELETE FROM refresh_tokens');
    console.log('   ✅ Refresh tokens cleared');

    console.log('\n9️⃣ Clearing password reset tokens...');
    await connection.execute('DELETE FROM password_reset_tokens');
    console.log('   ✅ Password reset tokens cleared');

    // Reset auto-increment counters
    console.log('\n🔢 Resetting auto-increment counters...');
    await connection.execute('ALTER TABLE books AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE courses AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE live_classes AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE modules AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE lessons AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE enrollments AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE user_progress AUTO_INCREMENT = 1');
    console.log('   ✅ Auto-increment counters reset');

    // Verify all content is cleared
    console.log('\n📊 Verifying content is cleared...');
    
    const [bookCount] = await connection.execute('SELECT COUNT(*) as count FROM books');
    const [courseCount] = await connection.execute('SELECT COUNT(*) as count FROM courses');
    const [liveClassCount] = await connection.execute('SELECT COUNT(*) as count FROM live_classes');
    const [enrollmentCount] = await connection.execute('SELECT COUNT(*) as count FROM enrollments');
    const [userProgressCount] = await connection.execute('SELECT COUNT(*) as count FROM user_progress');
    const [moduleCount] = await connection.execute('SELECT COUNT(*) as count FROM modules');
    const [lessonCount] = await connection.execute('SELECT COUNT(*) as count FROM lessons');
    const [refreshTokenCount] = await connection.execute('SELECT COUNT(*) as count FROM refresh_tokens');
    const [passwordResetCount] = await connection.execute('SELECT COUNT(*) as count FROM password_reset_tokens');

    console.log(`   📚 Books: ${bookCount[0].count}`);
    console.log(`   📖 Courses: ${courseCount[0].count}`);
    console.log(`   🎥 Live Classes: ${liveClassCount[0].count}`);
    console.log(`   📝 Enrollments: ${enrollmentCount[0].count}`);
    console.log(`   📈 User Progress: ${userProgressCount[0].count}`);
    console.log(`   📋 Modules: ${moduleCount[0].count}`);
    console.log(`   🎯 Lessons: ${lessonCount[0].count}`);
    console.log(`   🔑 Refresh Tokens: ${refreshTokenCount[0].count}`);
    console.log(`   🔐 Password Reset Tokens: ${passwordResetCount[0].count}`);

    // Check if all counts are 0
    const allCounts = [
      bookCount[0].count,
      courseCount[0].count,
      liveClassCount[0].count,
      enrollmentCount[0].count,
      userProgressCount[0].count,
      moduleCount[0].count,
      lessonCount[0].count,
      refreshTokenCount[0].count,
      passwordResetCount[0].count
    ];

    const allCleared = allCounts.every(count => count === 0);

    if (allCleared) {
      console.log('\n🎉 SUCCESS: All content has been cleared from the database!');
      console.log('✅ Database is now empty and ready for fresh data');
      console.log('✅ All auto-increment counters have been reset');
      console.log('✅ Foreign key constraints respected during deletion');
    } else {
      console.log('\n⚠️  WARNING: Some content may still remain in the database');
      console.log('Please check the counts above and verify manually if needed');
    }

    console.log('\n📋 Summary of cleared content:');
    console.log('   • All books and book-related data');
    console.log('   • All courses and course-related data');
    console.log('   • All live classes and live class-related data');
    console.log('   • All enrollments and user progress');
    console.log('   • All modules and lessons');
    console.log('   • All refresh tokens and password reset tokens');
    console.log('   • All auto-increment counters reset to 1');

  } catch (error) {
    console.error('❌ Error clearing content:', error);
    console.error('Error details:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
clearAllContent();
