-- Database initialization for Course Registration application
-- Target Engine: MySQL / MariaDB

CREATE DATABASE IF NOT EXISTS course_registration;
USE course_registration;

-- 1. Users Table
-- Stores student account details and credentials
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Stored as a secure hash in production
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Courses Table
-- Stores catalog details of available courses
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    fee DECIMAL(10, 2) NOT NULL,
    level VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Enrollments Table
-- Implements the many-to-many relationship between Users and Courses
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(50) DEFAULT 'Paid',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    -- Prevent duplicate enrollment for the same user in the same course
    UNIQUE KEY unique_user_course (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Initial Course Catalog Data
INSERT INTO courses (name, fee, level, description) VALUES
('Web Development Basics', 120.00, 'Beginner', 'HTML, CSS, and JavaScript fundamentals for new learners.'),
('Frontend Design Systems', 150.00, 'Intermediate', 'Clean layout, spacing, and reusable visual patterns.'),
('MySQL for Applications', 135.00, 'Beginner', 'Simple database concepts for application projects.')
ON DUPLICATE KEY UPDATE 
    fee = VALUES(fee),
    level = VALUES(level),
    description = VALUES(description);
