import { pool } from "../../config/db.config.js";

// Calculate retirement within 60 days
const retiringSoonQuery = `
    SELECT COUNT(*) AS retiringSoon 
    FROM user_profile 
    WHERE retirementDate IS NOT NULL 
    AND DATEDIFF(retirementDate, CURDATE()) <= 60
`;

export const getAdminDashboardData = async (req, res) => {
  try {
    const adminHrms = req.user.hrmsNo; // from JWT

    // 1. Fetch admin details
    const [adminRows] = await pool.execute(
      "SELECT employeeName, hrmsNo, emailId, role, branchName AS department, firstJoiningDate AS joined FROM user_profile WHERE hrmsNo = ?",
      [adminHrms]
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = adminRows[0];

    // 2. Total users
    const [totalUsersRow] = await pool.execute(
      "SELECT COUNT(*) AS totalUsers FROM user_profile"
    );

    // 3. Retiring in 60 days
    const [retiringSoonRow] = await pool.execute(retiringSoonQuery);

    // 4. Fully benefited users (example: all fund limit used)
    const [fullyBenefitedRow] = await pool.execute(`
      SELECT COUNT(*) AS fullyBenefited 
      FROM Fund_Request 
      WHERE form_status = 'Approved' 
        AND is_fund_submitted = 'Yes'
    `);

    // 5. Send Response
    return res.status(200).json({
      admin,
      stats: {
        totalUsers: totalUsersRow[0].totalUsers,
        retiringSoon: retiringSoonRow[0].retiringSoon,
        fullyBenefited: fullyBenefitedRow[0].fullyBenefited
      }
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
