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
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds
  // Optional: add ssl if Railway requires it
  // ssl: { rejectUnauthorized: true }
});

// --------------------------------
// Check DB Connection Only Once
// --------------------------------
export const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
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
    console.log('Executing Query in runQuery:', query, params);
    const [rows] = await pool.execute(query, params);
    console.log('Query Result:', rows);
    return rows;
  } catch (error) {
    console.error('❌ Query Execution Error:', error.sqlMessage || error);
    throw error;
  }
};

export default pool;
