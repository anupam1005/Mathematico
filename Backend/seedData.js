const mongoose = require('mongoose');
const { connectToDatabase } = require('./utils/database');

// Import models
const Book = require('./models/Book');
const Course = require('./models/Course');
const LiveClass = require('./models/LiveClass');
const User = require('./models/User');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectToDatabase();
    console.log('✅ Database connected for seeding');
    
    // Clear existing data
    await Book.deleteMany({});
    await Course.deleteMany({});
    await LiveClass.deleteMany({});
    console.log('🧹 Cleared existing data');
    
    // Seed Books
    const books = [
      {
        title: 'Advanced Calculus',
        author: 'Dr. Sarah Johnson',
        description: 'Comprehensive guide to advanced calculus concepts',
        category: 'Mathematics',
        level: 'Advanced',
        pages: 450,
        isbn: '978-1234567890',
        status: 'published',
        is_published: true,
        cover_image_url: '/uploads/covers/calculus-cover.jpg',
        pdf_url: '/uploads/pdfs/calculus-book.pdf',
        created_by: '1'
      },
      {
        title: 'Linear Algebra Fundamentals',
        author: 'Prof. Michael Chen',
        description: 'Essential linear algebra for beginners',
        category: 'Mathematics',
        level: 'Foundation',
        pages: 320,
        isbn: '978-1234567891',
        status: 'published',
        is_published: true,
        cover_image_url: '/uploads/covers/linear-algebra-cover.jpg',
        pdf_url: '/uploads/pdfs/linear-algebra-book.pdf',
        created_by: '1'
      },
      {
        title: 'Statistics and Probability',
        author: 'Dr. Emily Rodriguez',
        description: 'Complete guide to statistical analysis',
        category: 'Mathematics',
        level: 'Intermediate',
        pages: 380,
        isbn: '978-1234567892',
        status: 'published',
        is_published: true,
        cover_image_url: '/uploads/covers/statistics-cover.jpg',
        pdf_url: '/uploads/pdfs/statistics-book.pdf',
        created_by: '1'
      }
    ];
    
    const createdBooks = await Book.insertMany(books);
    console.log(`✅ Created ${createdBooks.length} books`);
    
    // Seed Courses
    const courses = [
      {
        title: 'Complete Mathematics Course',
        description: 'Master mathematics from basics to advanced concepts',
        category: 'Mathematics',
        level: 'Foundation',
        price: 2999,
        original_price: 4999,
        duration: 120, // hours
        instructor: 'Dr. Sarah Johnson',
        status: 'published',
        is_published: true,
        thumbnail: '/uploads/covers/math-course.jpg',
        pdf_url: '/uploads/pdfs/math-course-materials.pdf',
        created_by: '1'
      },
      {
        title: 'Advanced Calculus Mastery',
        description: 'Deep dive into calculus concepts and applications',
        category: 'Mathematics',
        level: 'Advanced',
        price: 3999,
        original_price: 5999,
        duration: 80,
        instructor: 'Prof. Michael Chen',
        status: 'published',
        is_published: true,
        thumbnail: '/uploads/covers/calculus-course.jpg',
        pdf_url: '/uploads/pdfs/calculus-course-materials.pdf',
        created_by: '1'
      },
      {
        title: 'Statistics and Data Analysis',
        description: 'Learn statistical analysis and data interpretation',
        category: 'Mathematics',
        level: 'Intermediate',
        price: 2499,
        original_price: 3499,
        duration: 60,
        instructor: 'Dr. Emily Rodriguez',
        status: 'published',
        is_published: true,
        thumbnail: '/uploads/covers/stats-course.jpg',
        pdf_url: '/uploads/pdfs/stats-course-materials.pdf',
        created_by: '1'
      }
    ];
    
    const createdCourses = await Course.insertMany(courses);
    console.log(`✅ Created ${createdCourses.length} courses`);
    
    // Seed Live Classes
    const liveClasses = [
      {
        title: 'Weekly Math Problem Solving',
        description: 'Interactive problem-solving session for mathematics',
        category: 'Mathematics',
        level: 'Foundation',
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        duration: 90, // minutes
        max_students: 50,
        instructor: 'Dr. Sarah Johnson',
        meeting_link: 'https://meet.google.com/math-session-1',
        status: 'scheduled',
        is_published: true,
        thumbnail: '/uploads/covers/live-math.jpg',
        created_by: '1'
      },
      {
        title: 'Advanced Calculus Workshop',
        description: 'Intensive workshop on advanced calculus topics',
        category: 'Mathematics',
        level: 'Advanced',
        scheduled_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        duration: 120,
        max_students: 30,
        instructor: 'Prof. Michael Chen',
        meeting_link: 'https://meet.google.com/calculus-workshop',
        status: 'scheduled',
        is_published: true,
        thumbnail: '/uploads/covers/live-calculus.jpg',
        created_by: '1'
      },
      {
        title: 'Statistics Q&A Session',
        description: 'Open Q&A session for statistics and probability',
        category: 'Mathematics',
        level: 'Intermediate',
        scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        duration: 60,
        max_students: 40,
        instructor: 'Dr. Emily Rodriguez',
        meeting_link: 'https://meet.google.com/stats-qa',
        status: 'scheduled',
        is_published: true,
        thumbnail: '/uploads/covers/live-stats.jpg',
        created_by: '1'
      }
    ];
    
    const createdLiveClasses = await LiveClass.insertMany(liveClasses);
    console.log(`✅ Created ${createdLiveClasses.length} live classes`);
    
    // Create test users
    const users = [
      {
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'user',
        is_active: true,
        email_verified: true
      },
      {
        name: 'Another Student',
        email: 'student2@test.com',
        password: 'password123',
        role: 'user',
        is_active: true,
        email_verified: true
      }
    ];
    
    for (const userData of users) {
      try {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.name}`);
      } catch (error) {
        console.log(`⚠️ User ${userData.name} might already exist`);
      }
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📚 Books: ${createdBooks.length}`);
    console.log(`📖 Courses: ${createdCourses.length}`);
    console.log(`🎓 Live Classes: ${createdLiveClasses.length}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
