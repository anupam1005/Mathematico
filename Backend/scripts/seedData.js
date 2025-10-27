const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import models
const User = require('../models/User');
const Course = require('../models/Course');
const Book = require('../models/Book');
const LiveClass = require('../models/LiveClass');

// Sample data
const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'student',
    grade: '10th',
    school: 'ABC High School',
    subjects: ['mathematics', 'physics', 'chemistry']
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'student',
    grade: '12th',
    school: 'XYZ High School',
    subjects: ['mathematics', 'biology', 'chemistry']
  },
  {
    name: 'Dr. Sarah Wilson',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'teacher',
    grade: 'Higher Education',
    school: 'University of Mathematics',
    subjects: ['mathematics', 'statistics']
  }
];

const sampleCourses = [
  {
    title: 'Advanced Calculus',
    description: 'A comprehensive course covering differential and integral calculus with applications.',
    shortDescription: 'Master calculus concepts and applications',
    category: 'mathematics',
    subject: 'Calculus',
    grade: '12th',
    level: 'advanced',
    tags: ['calculus', 'mathematics', 'advanced'],
    curriculum: [
      {
        module: 'Limits and Continuity',
        lessons: [
          {
            title: 'Introduction to Limits',
            description: 'Understanding the concept of limits',
            duration: 45,
            videoUrl: 'https://example.com/video1',
            materials: [
              {
                type: 'pdf',
                title: 'Limits Worksheet',
                url: 'https://example.com/worksheet1.pdf'
              }
            ],
            isFree: true
          },
          {
            title: 'Continuity',
            description: 'Understanding continuity of functions',
            duration: 50,
            videoUrl: 'https://example.com/video2',
            materials: [
              {
                type: 'pdf',
                title: 'Continuity Problems',
                url: 'https://example.com/problems1.pdf'
              }
            ],
            isFree: false
          }
        ]
      },
      {
        module: 'Derivatives',
        lessons: [
          {
            title: 'Basic Differentiation',
            description: 'Learning the rules of differentiation',
            duration: 60,
            videoUrl: 'https://example.com/video3',
            materials: [
              {
                type: 'pdf',
                title: 'Differentiation Rules',
                url: 'https://example.com/rules.pdf'
              }
            ],
            isFree: false
          }
        ]
      }
    ],
    thumbnail: 'https://example.com/calculus-thumbnail.jpg',
    previewVideo: 'https://example.com/calculus-preview.mp4',
    price: 2999,
    currency: 'INR',
    isFree: false,
    duration: 20,
    language: 'en',
    prerequisites: ['Basic Algebra', 'Trigonometry'],
    learningOutcomes: [
      'Understand limits and continuity',
      'Master differentiation techniques',
      'Apply calculus to real-world problems'
    ],
    instructor: {
      name: 'Dr. Sarah Wilson',
      bio: 'Professor of Mathematics with 15 years of experience',
      profilePicture: 'https://example.com/sarah-profile.jpg',
      qualifications: ['PhD Mathematics', 'MSc Statistics'],
      experience: '15 years teaching experience',
      instructorId: null // Will be set to teacher user ID
    },
    createdBy: null, // Will be set to admin user ID
    status: 'published',
    isAvailable: true,
    featured: true,
    maxStudents: 100
  },
  {
    title: 'Basic Algebra',
    description: 'Fundamental concepts of algebra for beginners.',
    shortDescription: 'Learn the basics of algebra',
    category: 'mathematics',
    subject: 'Algebra',
    grade: '9th',
    level: 'beginner',
    tags: ['algebra', 'mathematics', 'beginner'],
    curriculum: [
      {
        module: 'Variables and Expressions',
        lessons: [
          {
            title: 'Introduction to Variables',
            description: 'Understanding what variables are',
            duration: 30,
            videoUrl: 'https://example.com/algebra-video1',
            materials: [
              {
                type: 'pdf',
                title: 'Variables Worksheet',
                url: 'https://example.com/variables.pdf'
              }
            ],
            isFree: true
          }
        ]
      }
    ],
    thumbnail: 'https://example.com/algebra-thumbnail.jpg',
    previewVideo: 'https://example.com/algebra-preview.mp4',
    price: 999,
    currency: 'INR',
    isFree: false,
    duration: 10,
    language: 'en',
    prerequisites: [],
    learningOutcomes: [
      'Understand variables and expressions',
      'Solve basic algebraic equations'
    ],
    instructor: {
      name: 'Dr. Sarah Wilson',
      bio: 'Professor of Mathematics with 15 years of experience',
      profilePicture: 'https://example.com/sarah-profile.jpg',
      qualifications: ['PhD Mathematics', 'MSc Statistics'],
      experience: '15 years teaching experience',
      instructorId: null // Will be set to teacher user ID
    },
    createdBy: null, // Will be set to admin user ID
    status: 'published',
    isAvailable: true,
    featured: false,
    maxStudents: 50
  }
];

const sampleBooks = [
  {
    title: 'Mathematics for Class 10',
    author: 'Dr. Sarah Wilson',
    description: 'Comprehensive mathematics textbook for class 10 students covering all topics.',
    shortDescription: 'Complete mathematics textbook for class 10',
    category: 'mathematics',
    subject: 'Mathematics',
    grade: '10th',
    level: 'intermediate',
    tags: ['mathematics', 'class10', 'textbook'],
    thumbnail: 'https://example.com/math10-thumbnail.jpg',
    coverImage: 'https://example.com/math10-cover.jpg',
    pdfFile: 'https://example.com/math10.pdf',
    price: 499,
    currency: 'INR',
    isFree: false,
    language: 'en',
    publisher: 'Mathematico Publications',
    isbn: '978-1234567890',
    pages: 300,
    publishedYear: 2024,
    status: 'published',
    isAvailable: true,
    featured: true,
    createdBy: null // Will be set to admin user ID
  },
  {
    title: 'Physics Fundamentals',
    author: 'Dr. John Physics',
    description: 'Basic physics concepts explained in simple terms.',
    shortDescription: 'Learn physics fundamentals',
    category: 'physics',
    subject: 'Physics',
    grade: '11th',
    level: 'beginner',
    tags: ['physics', 'fundamentals', 'beginner'],
    thumbnail: 'https://example.com/physics-thumbnail.jpg',
    coverImage: 'https://example.com/physics-cover.jpg',
    pdfFile: 'https://example.com/physics.pdf',
    price: 399,
    currency: 'INR',
    isFree: false,
    language: 'en',
    publisher: 'Mathematico Publications',
    isbn: '978-1234567891',
    pages: 250,
    publishedYear: 2024,
    status: 'published',
    isAvailable: true,
    featured: false,
    createdBy: null // Will be set to admin user ID
  }
];

const sampleLiveClasses = [
  {
    title: 'Live Calculus Session',
    description: 'Interactive live session on calculus concepts with Q&A.',
    shortDescription: 'Live calculus tutoring session',
    category: 'mathematics',
    subject: 'Calculus',
    grade: '12th',
    level: 'advanced',
    tags: ['calculus', 'live', 'interactive'],
    thumbnail: 'https://example.com/live-calculus-thumbnail.jpg',
    instructor: {
      name: 'Dr. Sarah Wilson',
      bio: 'Professor of Mathematics with 15 years of experience',
      profilePicture: 'https://example.com/sarah-profile.jpg',
      qualifications: ['PhD Mathematics', 'MSc Statistics'],
      experience: '15 years teaching experience',
      instructorId: null // Will be set to teacher user ID
    },
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
    duration: 120, // 2 hours in minutes
    price: 199,
    currency: 'INR',
    isFree: false,
    maxStudents: 30,
    meetingLink: 'https://meet.example.com/calculus-session',
    meetingId: 'calculus-123',
    meetingPassword: 'math123',
    status: 'scheduled',
    isAvailable: true,
    featured: true,
    createdBy: null // Will be set to admin user ID
  },
  {
    title: 'Algebra Basics Live',
    description: 'Live session covering basic algebra concepts.',
    shortDescription: 'Live algebra basics session',
    category: 'mathematics',
    subject: 'Algebra',
    grade: '9th',
    level: 'beginner',
    tags: ['algebra', 'basics', 'live'],
    thumbnail: 'https://example.com/live-algebra-thumbnail.jpg',
    instructor: {
      name: 'Dr. Sarah Wilson',
      bio: 'Professor of Mathematics with 15 years of experience',
      profilePicture: 'https://example.com/sarah-profile.jpg',
      qualifications: ['PhD Mathematics', 'MSc Statistics'],
      experience: '15 years teaching experience',
      instructorId: null // Will be set to teacher user ID
    },
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5 hours duration
    duration: 90, // 1.5 hours in minutes
    price: 99,
    currency: 'INR',
    isFree: false,
    maxStudents: 25,
    meetingLink: 'https://meet.example.com/algebra-session',
    meetingId: 'algebra-456',
    meetingPassword: 'math456',
    status: 'scheduled',
    isAvailable: true,
    featured: false,
    createdBy: null // Will be set to admin user ID
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Book.deleteMany({});
    await LiveClass.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'dc2006089@gmail.com',
      password: 'Myname*321',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });
    console.log('✅ Admin user created');

    // Create sample users
    console.log('👥 Creating sample users...');
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${users.length} sample users`);

    // Update course data with admin user ID and generate slugs
    const coursesWithAdmin = sampleCourses.map(course => {
      // Generate slug from title
      const slug = course.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim('-'); // Remove leading/trailing hyphens
      
      return {
        ...course,
        createdBy: adminUser._id,
        slug: slug
      };
    });

    // Create sample courses one by one to avoid slug conflicts
    console.log('📚 Creating sample courses...');
    const courses = [];
    for (let i = 0; i < coursesWithAdmin.length; i++) {
      const courseData = coursesWithAdmin[i];
      try {
        const course = await Course.create(courseData);
        courses.push(course);
        console.log(`✅ Created course: ${course.title}`);
        
        // Small delay to ensure proper slug generation
        if (i < coursesWithAdmin.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error creating course ${courseData.title}:`, error.message);
        // Continue with other courses even if one fails
      }
    }
    console.log(`✅ Created ${courses.length} sample courses`);

    // Update book data with admin user ID and generate slugs
    const booksWithAdmin = sampleBooks.map(book => {
      // Generate slug from title
      const slug = book.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim('-'); // Remove leading/trailing hyphens
      
      return {
        ...book,
        createdBy: adminUser._id,
        slug: slug
      };
    });

    // Create sample books one by one to avoid slug conflicts
    console.log('📖 Creating sample books...');
    const books = [];
    for (let i = 0; i < booksWithAdmin.length; i++) {
      const bookData = booksWithAdmin[i];
      try {
        const book = await Book.create(bookData);
        books.push(book);
        console.log(`✅ Created book: ${book.title}`);
        
        // Small delay to ensure proper slug generation
        if (i < booksWithAdmin.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error creating book ${bookData.title}:`, error.message);
        // Continue with other books even if one fails
      }
    }
    console.log(`✅ Created ${books.length} sample books`);

    // Find the teacher user
    const teacherUser = users.find(user => user.role === 'teacher');
    
    // Update live class data with admin user ID, teacher ID, and generate slugs
    const liveClassesWithAdmin = sampleLiveClasses.map(liveClass => {
      // Generate slug from title
      const slug = liveClass.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim('-'); // Remove leading/trailing hyphens
      
      return {
        ...liveClass,
        createdBy: adminUser._id,
        slug: slug,
        instructor: {
          ...liveClass.instructor,
          instructorId: teacherUser._id
        }
      };
    });

    // Create sample live classes one by one to avoid slug conflicts
    console.log('🎥 Creating sample live classes...');
    const liveClasses = [];
    for (let i = 0; i < liveClassesWithAdmin.length; i++) {
      const liveClassData = liveClassesWithAdmin[i];
      try {
        const liveClass = await LiveClass.create(liveClassData);
        liveClasses.push(liveClass);
        console.log(`✅ Created live class: ${liveClass.title}`);
        
        // Small delay to ensure proper slug generation
        if (i < liveClassesWithAdmin.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error creating live class ${liveClassData.title}:`, error.message);
        // Continue with other live classes even if one fails
      }
    }
    console.log(`✅ Created ${liveClasses.length} sample live classes`);

    // Enroll some students in courses
    console.log('🎓 Enrolling students in courses...');
    const student1 = users[0]; // John Doe
    const student2 = users[1]; // Jane Smith
    
    // Enroll John in Advanced Calculus
    await courses[0].enrollStudent(student1._id);
    
    // Enroll Jane in Basic Algebra
    await courses[1].enrollStudent(student2._id);
    
    console.log('✅ Students enrolled in courses');

    // Purchase some books
    console.log('🛒 Recording book purchases...');
    const book1 = books[0]; // Mathematics for Class 10
    const book2 = books[1]; // Physics Fundamentals
    
    // John purchases Mathematics book
    book1.purchases += 1;
    await book1.save();
    console.log(`✅ John purchased: ${book1.title}`);
    
    // Jane purchases Physics book
    book2.purchases += 1;
    await book2.save();
    console.log(`✅ Jane purchased: ${book2.title}`);
    
    console.log('✅ Book purchases recorded');

    // Enroll students in live classes
    console.log('📺 Enrolling students in live classes...');
    const liveClass1 = liveClasses[0]; // Live Calculus Session
    const liveClass2 = liveClasses[1]; // Algebra Basics Live
    
    // John enrolls in Calculus live class
    liveClass1.enrolledStudents.push({
      student: student1._id,
      enrolledAt: new Date()
    });
    await liveClass1.save();
    
    // Jane enrolls in Algebra live class
    liveClass2.enrolledStudents.push({
      student: student2._id,
      enrolledAt: new Date()
    });
    await liveClass2.save();
    
    console.log('✅ Students enrolled in live classes');

    console.log('🎉 Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Admin users: 1`);
    console.log(`- Students: ${users.length}`);
    console.log(`- Courses: ${courses.length}`);
    console.log(`- Books: ${books.length}`);
    console.log(`- Live Classes: ${liveClasses.length}`);
    console.log('\n🔑 Admin Login:');
    console.log('Email: dc2006089@gmail.com');
    console.log('Password: Myname*321');
    console.log('\n👤 Student Logins:');
    console.log('Email: john@example.com, Password: password123');
    console.log('Email: jane@example.com, Password: password123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
if (require.main === module) {
  seedData();
}

module.exports = seedData;
