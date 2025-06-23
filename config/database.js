import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "balon_tegal",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL database");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Error connecting to MySQL database:", error.message);
    return false;
  }
};

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();

    // Products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        category ENUM('bucket', 'dekorasi balon', 'dekorasi pernikahan') NOT NULL,
        image_url VARCHAR(255),
        features JSON,
        rating DECIMAL(3,2) DEFAULT 5.00,
        reviews_count INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(100),
        customer_address TEXT,
        order_type ENUM('standard', 'custom') NOT NULL,
        product_id INT,
        custom_description TEXT,
        quantity INT DEFAULT 1,
        total_price DECIMAL(10,2),
        status ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    // Testimonials table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        customer_role VARCHAR(100),
        customer_location VARCHAR(100),
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        testimonial_text TEXT NOT NULL,
        image_url VARCHAR(255),
        is_approved BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Contact messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        subject VARCHAR(200),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'superadmin') DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Galeri table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS galleries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100),
        image_url VARCHAR(255),
        tag VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    connection.release();
    console.log("✅ Database tables initialized");
    return true;
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    throw error;
  }
};

// Helper function to run queries with promises
export const runQuery = async (query, params = []) => {
  try {
    const [result] = await pool.execute(query, params);
    return {
      id: result.insertId,
      changes: result.affectedRows,
      result,
    };
  } catch (error) {
    throw error;
  }
};

// Helper function to get single row
export const getRow = async (query, params = []) => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows[0] || null;
  } catch (error) {
    throw error;
  }
};

// Helper function to get all rows
export const getAllRows = async (query, params = []) => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Helper function to get multiple rows with pagination
export const getPaginatedRows = async (
  query,
  params = [],
  page = 1,
  limit = 10
) => {
  try {
    const offset = (page - 1) * limit;
    const paginatedQuery = `${query} LIMIT ? OFFSET ?`;
    const paginatedParams = [...params, limit, offset];

    const [rows] = await pool.execute(paginatedQuery, paginatedParams);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Helper function to count rows
export const countRows = async (query, params = []) => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows[0].count || 0;
  } catch (error) {
    throw error;
  }
};

export default pool;
