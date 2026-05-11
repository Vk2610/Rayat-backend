import { pool } from "./src/config/db.config.js";

const showSchema = async () => {
  try {
    const [rows] = await pool.execute('DESCRIBE user_profile');
    console.log('--- user_profile schema ---');
    console.log(rows);

  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
showSchema();
