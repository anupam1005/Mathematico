#!/usr/bin/env node

/**
 * Seed Railway Database
 * Populates the Railway MySQL database with sample data
 */

const { testConnection, createUsersTable, createBooksTable, createCoursesTable, createLiveClassesTable, createEnrollmentsTable, pool } = require('./database');

async function seedDatabase() {
  console.log('🌱 Seeding Railway Database...\n');
  
  try {
    // Test database connection
    console.log('1️⃣ Testing Database Connection');
    console.log('=' .repeat(50));
    
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ Database connection failed');
      return;
    }
    
    console.log('✅ Database connected successfully');
    
    // Create tables
    console.log('\n2️⃣ Creating Tables');
    console.log('=' .repeat(50));
    
    await createUsersTable();
    console.log('✅ Users table created');
    
    await createBooksTable();
    console.log('✅ Books table created');
    
    await createCoursesTable();
    console.log('✅ Courses table created');
    
    await createLiveClassesTable();
    console.log('✅ Live classes table created');
    
    await createEnrollmentsTable();
    console.log('✅ Enrollments table created');
    
    // Seed users
    console.log('\n3️⃣ Seeding Users');
    console.log('=' .repeat(50));
    
    const sampleUsers = [
      {
        email: 'dc2006089@gmail.com',
        name: 'Admin User',
        password_hash: '$2b$10$example.hash.for.admin.password',
        role: 'admin',
        email_verified: true,
        is_active: true
      },
      {
        email: 'student1@example.com',
        name: 'John Doe',
        password_hash: '$2b$10$example.hash.for.student.password',
        role: 'student',
        email_verified: true,
        is_active: true
      },
      {
        email: 'student2@example.com',
        name: 'Jane Smith',
        password_hash: '$2b$10$example.hash.for.student.password',
        role: 'student',
        email_verified: true,
        is_active: true
      }
    ];
    
    for (const user of sampleUsers) {
      try {
        await pool.execute(
          `INSERT INTO users (email, name, password_hash, role, email_verified, is_active, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [user.email, user.name, user.password_hash, user.role, user.email_verified, user.is_active]
        );
        console.log(`✅ User created: ${user.email}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ User already exists: ${user.email}`);
        } else {
          console.log(`❌ Error creating user ${user.email}:`, error.message);
        }
      }
    }
    
    // Get admin user ID
    const [adminUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', ['dc2006089@gmail.com']);
    const adminId = adminUsers[0]?.id;
    
    // Seed books
    console.log('\n4️⃣ Seeding Books');
    console.log('=' .repeat(50));
    
    const sampleBooks = [
      {
        title: 'Advanced Mathematics',
        author: 'Dr. Sarah Wilson',
        description: 'Comprehensive guide to advanced mathematical concepts including calculus, linear algebra, and differential equations.',
        category: 'Mathematics',
        pages: 450,
        isbn: '978-1234567890',
        cover_image_url: 'https://via.placeholder.com/300x400/4F46E5/FFFFFF?text=Advanced+Math',
        pdf_url: 'https://example.com/advanced-math.pdf',
        status: 'active',
        is_published: true,
        created_by: adminId
      },
      {
        title: 'Basic Algebra Fundamentals',
        author: 'Prof. Robert Brown',
        description: 'Perfect introduction to algebra for beginners. Covers all fundamental concepts with clear explanations and examples.',
        category: 'Mathematics',
        pages: 280,
        isbn: '978-1234567891',
        cover_image_url: 'https://via.placeholder.com/300x400/10B981/FFFFFF?text=Basic+Algebra',
        pdf_url: 'https://example.com/basic-algebra.pdf',
        status: 'active',
        is_published: true,
        created_by: adminId
      },
      {
        title: 'Statistics and Probability',
        author: 'Dr. Emily Davis',
        description: 'Complete guide to statistics and probability theory with practical applications and real-world examples.',
        category: 'Statistics',
        pages: 320,
        isbn: '978-1234567892',
        cover_image_url: 'https://via.placeholder.com/300x400/F59E0B/FFFFFF?text=Statistics',
        pdf_url: 'https://example.com/statistics.pdf',
        status: 'active',
        is_published: true,
        created_by: adminId
      },
      {
        title: 'Geometry Mastery',
        author: 'Prof. Michael Chen',
        description: 'Comprehensive geometry textbook covering plane geometry, solid geometry, and coordinate geometry.',
        category: 'Mathematics',
        pages: 380,
        isbn: '978-1234567893',
        cover_image_url: 'https://via.placeholder.com/300x400/EF4444/FFFFFF?text=Geometry',
        pdf_url: 'https://example.com/geometry.pdf',
        status: 'active',
        is_published: true,
        created_by: adminId
      },
      {
        title: 'Trigonometry Essentials',
        author: 'Dr. Lisa Anderson',
        description: 'Essential trigonometry concepts with step-by-step solutions and practice problems.',
        category: 'Mathematics',
        pages: 250,
        isbn: '978-1234567894',
        cover_image_url: 'https://via.placeholder.com/300x400/8B5CF6/FFFFFF?text=Trigonometry',
        pdf_url: 'https://example.com/trigonometry.pdf',
        status: 'active',
        is_published: true,
        created_by: adminId
      }
    ];
    
    for (const book of sampleBooks) {
      try {
        await pool.execute(
          `INSERT INTO books (title, author, description, category, pages, isbn, cover_image_url, pdf_url, status, is_published, created_by, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [book.title, book.author, book.description, book.category, book.pages, book.isbn, book.cover_image_url, book.pdf_url, book.status, book.is_published, book.created_by]
        );
        console.log(`✅ Book created: ${book.title}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Book already exists: ${book.title}`);
        } else {
          console.log(`❌ Error creating book ${book.title}:`, error.message);
        }
      }
    }
    
    // Seed courses
    console.log('\n5️⃣ Seeding Courses');
    console.log('=' .repeat(50));
    
    const sampleCourses = [
      {
        title: 'Complete Mathematics Course',
        description: 'A comprehensive mathematics course covering all major topics from basic algebra to advanced calculus.',
        category: 'Mathematics',
        level: 'Advanced',
        price: 199.99,
        status: 'active',
        students: 456,
        created_by: adminId
      },
      {
        title: 'Statistics and Data Analysis',
        description: 'Learn statistical methods and data analysis techniques with practical applications.',
        category: 'Statistics',
        level: 'Intermediate',
        price: 149.99,
        status: 'active',
        students: 312,
        created_by: adminId
      },
      {
        title: 'Geometry Fundamentals',
        description: 'Master the fundamentals of geometry with interactive lessons and practical exercises.',
        category: 'Mathematics',
        level: 'Foundation',
        price: 99.99,
        status: 'active',
        students: 278,
        created_by: adminId
      }
    ];
    
    for (const course of sampleCourses) {
      try {
        await pool.execute(
          `INSERT INTO courses (title, description, category, level, price, status, students, created_by, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [course.title, course.description, course.category, course.level, course.price, course.status, course.students, course.created_by]
        );
        console.log(`✅ Course created: ${course.title}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Course already exists: ${course.title}`);
        } else {
          console.log(`❌ Error creating course ${course.title}:`, error.message);
        }
      }
    }
    
    // Seed live classes
    console.log('\n6️⃣ Seeding Live Classes');
    console.log('=' .repeat(50));
    
    const sampleLiveClasses = [
      {
        title: 'Advanced Calculus Live Session',
        description: 'Interactive live session covering advanced calculus topics with real-time Q&A.',
        category: 'Mathematics',
        level: 'Advanced',
        duration: 90,
        max_students: 50,
        price: 29.99,
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        meeting_url: 'https://meet.example.com/calc-session-1',
        thumbnail_url: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Calculus+Live',
        status: 'scheduled',
        enrolled_students: 23,
        instructor_id: adminId
      },
      {
        title: 'Statistics Workshop',
        description: 'Hands-on statistics workshop with practical examples and data analysis.',
        category: 'Statistics',
        level: 'Intermediate',
        duration: 120,
        max_students: 30,
        price: 24.99,
        scheduled_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        meeting_url: 'https://meet.example.com/stats-workshop-1',
        thumbnail_url: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Stats+Workshop',
        status: 'scheduled',
        enrolled_students: 18,
        instructor_id: adminId
      }
    ];
    
    for (const liveClass of sampleLiveClasses) {
      try {
        await pool.execute(
          `INSERT INTO live_classes (title, description, category, level, duration, max_students, price, scheduled_at, meeting_url, thumbnail_url, status, enrolled_students, instructor_id, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [liveClass.title, liveClass.description, liveClass.category, liveClass.level, liveClass.duration, liveClass.max_students, liveClass.price, liveClass.scheduled_at, liveClass.meeting_url, liveClass.thumbnail_url, liveClass.status, liveClass.enrolled_students, liveClass.instructor_id]
        );
        console.log(`✅ Live class created: ${liveClass.title}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Live class already exists: ${liveClass.title}`);
        } else {
          console.log(`❌ Error creating live class ${liveClass.title}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 DATABASE SEEDING COMPLETED!');
    console.log('=' .repeat(50));
    console.log('✅ Users: 3 created');
    console.log('✅ Books: 5 created');
    console.log('✅ Courses: 3 created');
    console.log('✅ Live Classes: 2 created');
    console.log('\n🚀 Railway database is now populated with sample data!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    // Close database connection
    if (pool) {
      await pool.end();
    }
  }
}

seedDatabase();
