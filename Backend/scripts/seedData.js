const mongoose = require('mongoose');
require('dotenv').config({ path: `${__dirname}/../config.env` });

// Import models
const User = require('../models/User');
const Book = require('../models/Book');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');
const Payment = require('../models/Payment');

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@mathematico.com',
    password: 'admin123',
    role: 'admin',
    is_admin: true,
    status: 'active'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'user123',
    role: 'user',
    is_admin: false,
    status: 'active'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'user123',
    role: 'user',
    is_admin: false,
    status: 'active'
  }
];

const sampleBooks = [
  {
    title: 'Advanced Calculus',
    author: 'Dr. Mathematics',
    description: 'A comprehensive guide to advanced calculus concepts',
    category: 'Mathematics',
    level: 'Advanced',
    pages: 450,
    isbn: '978-1234567890',
    price: 29.99,
    status: 'published',
    is_featured: true
  },
  {
    title: 'Linear Algebra Fundamentals',
    author: 'Prof. Algebra',
    description: 'Essential concepts in linear algebra for beginners',
    category: 'Mathematics',
    level: 'Foundation',
    pages: 320,
    isbn: '978-1234567891',
    price: 24.99,
    status: 'published',
    is_featured: false
  },
  {
    title: 'Statistics and Probability',
    author: 'Dr. Statistics',
    description: 'Complete guide to statistics and probability theory',
    category: 'Mathematics',
    level: 'Intermediate',
    pages: 380,
    isbn: '978-1234567892',
    price: 27.99,
    status: 'published',
    is_featured: true
  }
];

const sampleCourses = [
  {
    title: 'Complete Mathematics Course',
    description: 'Master all mathematical concepts from basics to advanced',
    instructor: 'Dr. Mathematics',
    price: 99.99,
    original_price: 149.99,
    duration: 40,
    level: 'Foundation',
    category: 'Mathematics',
    status: 'published',
    is_featured: true,
    enrolled_count: 150
  },
  {
    title: 'Calculus Mastery',
    description: 'Deep dive into calculus concepts and applications',
    instructor: 'Prof. Calculus',
    price: 79.99,
    original_price: 99.99,
    duration: 30,
    level: 'Advanced',
    category: 'Mathematics',
    status: 'published',
    is_featured: false,
    enrolled_count: 75
  },
  {
    title: 'Statistics for Data Science',
    description: 'Learn statistics concepts essential for data science',
    instructor: 'Dr. Data',
    price: 89.99,
    original_price: 119.99,
    duration: 25,
    level: 'Intermediate',
    category: 'Data Science',
    status: 'published',
    is_featured: true,
    enrolled_count: 200
  }
];

const sampleLiveClasses = [
  {
    title: 'Live Calculus Session',
    description: 'Interactive live session on calculus fundamentals',
    instructor: 'Dr. Mathematics',
    meetingLink: 'https://zoom.us/j/123456789',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    duration: 90,
    maxStudents: 50,
    price: 19.99,
    status: 'upcoming',
    is_featured: true,
    category: 'Mathematics',
    level: 'Foundation'
  },
  {
    title: 'Advanced Algebra Workshop',
    description: 'Workshop on advanced algebraic concepts',
    instructor: 'Prof. Algebra',
    meetingLink: 'https://zoom.us/j/987654321',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    duration: 120,
    maxStudents: 30,
    price: 29.99,
    status: 'upcoming',
    is_featured: false,
    category: 'Mathematics',
    level: 'Advanced'
  },
  {
    title: 'Statistics Q&A Session',
    description: 'Question and answer session on statistics',
    instructor: 'Dr. Statistics',
    meetingLink: 'https://zoom.us/j/456789123',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    duration: 60,
    maxStudents: 100,
    price: 9.99,
    status: 'upcoming',
    is_featured: true,
    category: 'Mathematics',
    level: 'Intermediate'
  }
];

const samplePayments = [
  {
    user_id: null, // Will be set after user creation
    item_type: 'course',
    item_id: null, // Will be set after course creation
    amount: 99.99,
    currency: 'INR',
    status: 'completed',
    payment_method: 'credit_card',
    payment_gateway: 'razorpay',
    transaction_id: 'txn_123456789',
    gateway_response: { success: true, payment_id: 'pay_123456789' }
  },
  {
    user_id: null, // Will be set after user creation
    item_type: 'book',
    item_id: null, // Will be set after book creation
    amount: 29.99,
    currency: 'INR',
    status: 'completed',
    payment_method: 'upi',
    payment_gateway: 'razorpay',
    transaction_id: 'txn_987654321',
    gateway_response: { success: true, payment_id: 'pay_987654321' }
  }
];

async function seedDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Book.deleteMany({});
    await Course.deleteMany({});
    await LiveClass.deleteMany({});
    await Payment.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await User.createUser(userData);
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name}`);
    }

    // Create books
    console.log('📚 Creating books...');
    const createdBooks = [];
    for (const bookData of sampleBooks) {
      const book = await Book.create({
        ...bookData,
        created_by: createdUsers[0]._id // Admin user
      });
      createdBooks.push(book);
      console.log(`✅ Created book: ${book.title}`);
    }

    // Create courses
    console.log('🎓 Creating courses...');
    const createdCourses = [];
    for (const courseData of sampleCourses) {
      const course = await Course.create({
        ...courseData,
        created_by: createdUsers[0]._id // Admin user
      });
      createdCourses.push(course);
      console.log(`✅ Created course: ${course.title}`);
    }

    // Create live classes
    console.log('🎥 Creating live classes...');
    const createdLiveClasses = [];
    for (const liveClassData of sampleLiveClasses) {
      const liveClass = await LiveClass.create({
        ...liveClassData,
        created_by: createdUsers[0]._id // Admin user
      });
      createdLiveClasses.push(liveClass);
      console.log(`✅ Created live class: ${liveClass.title}`);
    }

    // Create payments
    console.log('💳 Creating payments...');
    const createdPayments = [];
    for (let i = 0; i < samplePayments.length; i++) {
      const paymentData = {
        ...samplePayments[i],
        user_id: createdUsers[1]._id, // John Doe
        item_id: i === 0 ? createdCourses[0]._id : createdBooks[0]._id
      };
      const payment = await Payment.create(paymentData);
      createdPayments.push(payment);
      console.log(`✅ Created payment: ${payment.transaction_id}`);
    }

    // Display summary
    console.log('\n📊 Database Seeding Summary:');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`📚 Books: ${createdBooks.length}`);
    console.log(`🎓 Courses: ${createdCourses.length}`);
    console.log(`🎥 Live Classes: ${createdLiveClasses.length}`);
    console.log(`💳 Payments: ${createdPayments.length}`);

    console.log('\n✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding
seedDatabase();
