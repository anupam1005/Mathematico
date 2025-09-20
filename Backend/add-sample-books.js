const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSampleBooks() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    console.log('Connected to database successfully');

    // Add sample books
    const sampleBooks = [
      {
        title: 'Advanced Calculus',
        author: 'Dr. John Smith',
        description: 'Comprehensive textbook covering advanced calculus topics including multivariable calculus, vector analysis, and differential equations.',
        category: 'Mathematics',
        pages: 450,
        isbn: '978-1234567890',
        coverImage: '/placeholder.svg',
        pdfUrl: '/uploads/advanced-calculus.pdf',
        status: 'published',
        isPublished: true
      },
      {
        title: 'Linear Algebra Fundamentals',
        author: 'Prof. Jane Doe',
        description: 'Essential guide to linear algebra concepts and applications in mathematics and engineering.',
        category: 'Mathematics',
        pages: 320,
        isbn: '978-0987654321',
        coverImage: '/placeholder.svg',
        pdfUrl: '/uploads/linear-algebra.pdf',
        status: 'published',
        isPublished: true
      },
      {
        title: 'Statistics and Probability',
        author: 'Dr. Mike Johnson',
        description: 'Complete guide to statistical methods and probability theory with practical examples.',
        category: 'Statistics',
        pages: 380,
        isbn: '978-1122334455',
        coverImage: '/placeholder.svg',
        pdfUrl: '/uploads/statistics.pdf',
        status: 'published',
        isPublished: true
      },
      {
        title: 'Discrete Mathematics',
        author: 'Prof. Sarah Wilson',
        description: 'Introduction to discrete mathematical structures and their applications in computer science.',
        category: 'Computer Science',
        pages: 280,
        isbn: '978-5566778899',
        coverImage: '/placeholder.svg',
        pdfUrl: '/uploads/discrete-math.pdf',
        status: 'published',
        isPublished: true
      },
      {
        title: 'Differential Equations',
        author: 'Dr. Robert Brown',
        description: 'Comprehensive treatment of ordinary and partial differential equations with applications.',
        category: 'Mathematics',
        pages: 420,
        isbn: '978-9988776655',
        coverImage: '/placeholder.svg',
        pdfUrl: '/uploads/differential-equations.pdf',
        status: 'published',
        isPublished: true
      }
    ];

    console.log('Adding sample books...');
    
    for (const book of sampleBooks) {
      const insertQuery = `
        INSERT INTO books (title, author, description, category, pages, isbn, coverImage, pdfUrl, status, isPublished)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        book.title,
        book.author,
        book.description,
        book.category,
        book.pages,
        book.isbn,
        book.coverImage,
        book.pdfUrl,
        book.status,
        book.isPublished
      ];
      
      await connection.execute(insertQuery, values);
      console.log(`✅ Added book: ${book.title}`);
    }
    
    console.log('🎉 All sample books added successfully!');
    
    // Verify the books were added
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM books');
    console.log(`📚 Total books in database: ${rows[0].count}`);
    
  } catch (error) {
    console.error('Error adding sample books:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addSampleBooks();
