import { pool } from "./src/config/db.config.js";
import { v4 as uuidv4 } from "uuid";

const createOrUpdateAdmin = async () => {
  try {
    const hrmsNo = "admin";
    const password = "admin"; // stored as mobileNo
    const adminId = uuidv4();
    const role = "admin";

    console.log("Creating or updating admin user in user_profile table...");

    // Check if admin already exists
    const [rows] = await pool.execute('SELECT * FROM user_profile WHERE hrmsNo = ?', [hrmsNo]);

    if (rows.length > 0) {
      console.log("Admin user exists. Deleting to recreate...");
      await pool.execute('DELETE FROM user_profile WHERE hrmsNo = ?', [hrmsNo]);
    }

    console.log("Creating new admin with id in user_profile.");
    await pool.execute(
      'INSERT INTO user_profile (id, hrmsNo, mobileNo, role) VALUES (?, ?, ?, ?)',
      [adminId, hrmsNo, password, role]
    );
    console.log(`Admin recreated successfully with id: ${adminId}`);

  } catch (err) {
    console.error("Error creating/updating admin:", err);
  } finally {
    process.exit(0);
  }
};

createOrUpdateAdmin();
