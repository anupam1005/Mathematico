-- Create the database
CREATE DATABASE IF NOT EXISTS mathematico;
USE mathematico;

-- Drop all tables in reverse order of dependencies to handle foreign key constraints
-- First drop tables that have foreign key constraints (child tables)
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS live_classes;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;

-- Users table - FIXED: Consistent field naming
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255) NULL,
    avatar_url VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active', -- FIXED: Use status instead of is_active
    last_login DATETIME,
    login_attempts INT DEFAULT 0,
    lock_until DATETIME NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    role ENUM('user', 'admin', 'instructor') DEFAULT 'user', -- user: normal user, admin: admin user, instructor: course instructor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `email` (`email`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_status` (`status`), -- FIXED: Updated index name
    INDEX `idx_users_email_verified` (`email_verified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Courses table - FIXED: Simplified status management
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY, -- FIXED: Use auto-increment for easier management
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(255), -- FIXED: Simplified field name
    price DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft', -- FIXED: Single status field
    level ENUM('Foundation', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Foundation',
    category VARCHAR(100),
    instructor VARCHAR(255), -- FIXED: Store instructor name directly for simplicity
    duration INT DEFAULT 0, -- FIXED: Duration in minutes
    content TEXT,
    requirements TEXT,
    what_you_will_learn JSON,
    who_is_this_for JSON,
    topics JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    original_price DECIMAL(10, 2),
    students INT DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `slug` (`slug`),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX `idx_courses_status` (`status`),
    INDEX `idx_courses_category` (`category`),
    INDEX `idx_courses_level` (`level`),
    INDEX `idx_courses_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Books table - FIXED: Simplified status management
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY, -- FIXED: Use auto-increment for easier management
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    author VARCHAR(255),
    publisher VARCHAR(255),
    category VARCHAR(100),
    subject VARCHAR(100),
    class VARCHAR(100),
    level ENUM('Foundation', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Foundation',
    cover_image_url VARCHAR(255),
    pdf_url VARCHAR(255),
    pages INT,
    isbn VARCHAR(50) NULL,
    price DECIMAL(10, 2) DEFAULT 0.00, -- FIXED: Added price field
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft', -- FIXED: Single status field
    is_featured BOOLEAN DEFAULT FALSE,
    downloads INT DEFAULT 0,
    tags JSON,
    table_of_contents TEXT,
    summary TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `slug` (`slug`),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX `idx_books_status` (`status`),
    INDEX `idx_books_is_featured` (`is_featured`),
    INDEX `idx_books_category` (`category`),
    INDEX `idx_books_subject` (`subject`),
    INDEX `idx_books_level` (`level`),
    INDEX `idx_books_created_by` (`created_by`),
    INDEX `idx_books_isbn` (`isbn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Live Classes table - FIXED: Consistent field naming
CREATE TABLE live_classes (
    id INT AUTO_INCREMENT PRIMARY KEY, -- FIXED: Use auto-increment for easier management
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subject VARCHAR(100),
    class VARCHAR(100),
    level ENUM('Foundation', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Foundation',
    thumbnail VARCHAR(255), -- FIXED: Simplified field name
    meeting_link VARCHAR(255), -- FIXED: Simplified field name
    meeting_id VARCHAR(255),
    meeting_password VARCHAR(255),
    date TIMESTAMP, -- FIXED: Simplified field name (was scheduled_at)
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    duration INT NOT NULL DEFAULT 60,
    max_students INT NOT NULL DEFAULT 50,
    enrolled_students INT DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    original_price DECIMAL(10, 2),
    status ENUM('draft', 'upcoming', 'live', 'completed', 'cancelled') DEFAULT 'draft', -- FIXED: Consistent with frontend expectations
    is_featured BOOLEAN DEFAULT FALSE,
    is_recording_enabled BOOLEAN DEFAULT FALSE,
    recording_url VARCHAR(255),
    topics JSON,
    prerequisites TEXT,
    materials TEXT,
    notes TEXT,
    instructor VARCHAR(255), -- FIXED: Store instructor name directly for simplicity
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `slug` (`slug`),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX `idx_live_classes_status` (`status`),
    INDEX `idx_live_classes_is_featured` (`is_featured`),
    INDEX `idx_live_classes_category` (`category`),
    INDEX `idx_live_classes_subject` (`subject`),
    INDEX `idx_live_classes_level` (`level`),
    INDEX `idx_live_classes_date` (`date`), -- FIXED: Updated index name
    INDEX `idx_live_classes_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table - NEW: Added missing payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    item_type ENUM('course', 'book', 'live_class') NOT NULL,
    item_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_gateway VARCHAR(50),
    transaction_id VARCHAR(255),
    gateway_response JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX `idx_payments_user_id` (`user_id`),
    INDEX `idx_payments_status` (`status`),
    INDEX `idx_payments_item_type` (`item_type`),
    INDEX `idx_payments_item_id` (`item_id`),
    INDEX `idx_payments_transaction_id` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modules table (for organizing course content)
CREATE TABLE modules (
    id VARCHAR(36) PRIMARY KEY,
    course_id INT NOT NULL, -- FIXED: Updated to match courses table
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX `idx_modules_course_id` (`course_id`),
    INDEX `idx_modules_position` (`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lessons table
CREATE TABLE lessons (
    id VARCHAR(36) PRIMARY KEY,
    module_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content_type ENUM('video', 'article', 'quiz', 'assignment') NOT NULL,
    content_url VARCHAR(255),
    content_text TEXT,
    duration INT, -- in minutes
    position INT NOT NULL DEFAULT 0,
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `slug` (`slug`),
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX `idx_lessons_module_id` (`module_id`),
    INDEX `idx_lessons_content_type` (`content_type`),
    INDEX `idx_lessons_position` (`position`),
    INDEX `idx_lessons_is_free` (`is_free`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enrollments table
CREATE TABLE enrollments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_id INT NOT NULL, -- FIXED: Updated to match courses table
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
    payment_status ENUM('pending', 'paid', 'completed', 'refunded', 'failed') DEFAULT 'pending',
    amount_paid DECIMAL(10, 2),
    amount DECIMAL(10, 2),
    payment_id VARCHAR(255),
    order_id VARCHAR(255),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_course` (`user_id`, `course_id`),
    INDEX `idx_enrollments_user_id` (`user_id`),
    INDEX `idx_enrollments_course_id` (`course_id`),
    INDEX `idx_enrollments_status` (`status`),
    INDEX `idx_enrollments_payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User progress tracking
CREATE TABLE user_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    lesson_id VARCHAR(36) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    progress_percentage INT DEFAULT 0,
    last_accessed TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_lesson` (`user_id`, `lesson_id`),
    INDEX `idx_user_progress_user_id` (`user_id`),
    INDEX `idx_user_progress_lesson_id` (`lesson_id`),
    INDEX `idx_user_progress_is_completed` (`is_completed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_group VARCHAR(50) NOT NULL,
    data_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settings_group (setting_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) DEFAULT NULL,
    token_id VARCHAR(100) NOT NULL UNIQUE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_tokens_user_id (user_id),
    INDEX idx_refresh_tokens_token_id (token_id),
    INDEX idx_refresh_tokens_is_revoked (is_revoked),
    INDEX idx_refresh_tokens_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create password_reset_tokens table
CREATE TABLE password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_password_reset_token (token),
    INDEX idx_password_reset_user_id (user_id),
    INDEX idx_password_reset_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_group, data_type) VALUES
('site_name', 'Mathematico', 'general', 'string'),
('site_description', 'Learn mathematics the easy way', 'general', 'string'),
('contact_email', 'support@mathematico.com', 'general', 'string'),
('maintenance_mode', 'false', 'general', 'boolean'),
('user_registration', 'true', 'user', 'boolean'),
('email_notifications', 'true', 'email', 'boolean'),
('default_currency', 'USD', 'payment', 'string'),
('timezone', 'UTC', 'general', 'string');

-- Create the admin user with working password
-- Email: dc2006089@gmail.com
-- Password: Myname*321
-- This is the ONLY admin user that should exist
-- 
-- Normal users can register with any email and password through the application
-- The password hash below is generated using bcrypt with 10 salt rounds
INSERT IGNORE INTO users (
    id, 
    name, 
    email, 
    password_hash, 
    is_admin, 
    role, 
    email_verified,
    status, -- FIXED: Use status instead of is_active
    created_at, 
    updated_at
) VALUES (
    'admin-user-001',
    'Admin User',
    'dc2006089@gmail.com',
    '$2b$10$1Tjrz1J0Vy79Ay9D0iu.Ru.2eLs91AGbCImiRt2LMZHXEusZwlj4a',
    TRUE,
    'admin',
    TRUE,
    'active', -- FIXED: Use status instead of is_active
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    is_admin = TRUE,
    role = 'admin',
    email_verified = TRUE,
    status = 'active', -- FIXED: Use status instead of is_active
    updated_at = NOW();

-- Database is ready for production use
-- No sample data inserted - ready for real content
