import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// -------------------------------
// Validate Environment Variables
// -------------------------------
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
  }
});

// --------------------------------
// Create MySQL Connection Pool
// --------------------------------
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,

  // ✅ IMPORTANT: Fix Unicode / Marathi / ₹ / — issues
  charset: 'utf8mb4',

  // ✅ Recommended for full Unicode support
  supportBigNumbers: true,
  bigNumberStrings: true,

  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,

  // ✅ Keep timestamps consistent
  timezone: 'Z',
});

// --------------------------------
// Check DB Connection Only Once
// --------------------------------
export const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();

    // ✅ Force UTF-8 session encoding
    await connection.query('SET NAMES utf8mb4');

    console.log('✅ Database connected successfully');

    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

// --------------------------------
// Safe Query Helper
// --------------------------------
export const runQuery = async (query, params = []) => {
  try {
    console.log('Executing Query:', query, params);

    const [rows] = await pool.execute(query, params);

    return rows;
  } catch (error) {
    console.error(
      '❌ Query Execution Error:',
      error.sqlMessage || error.message || error,
    );

    throw error;
  }
};

export default pool;
