import { pool } from "../../config/db.config.js";

// Helper: date difference in days
const daysBetween = (date1, date2) => {
  const ms = new Date(date2) - new Date(date1);
  return ms / (1000 * 60 * 60 * 24);
};

export const getAdminStats = async (req, res) => {
  try {
    // 1️⃣ TOTAL USERS
    const [allUsers] = await pool.query("SELECT * FROM user_profile");

    // 2️⃣ RETIRING IN 60 DAYS
    const [retiring] = await pool.query(`
      SELECT * FROM user_profile 
      WHERE retirementDate IS NOT NULL
    `);

    const retiringSoon = retiring.filter((u) => {
      const days = daysBetween(new Date(), u.retirementDate);
      return days > 0 && days <= 60;
    });

    const [fullAmountPaidRows] = await pool.query(`
      SELECT COUNT(*) AS fullAmountPaidUsers
      FROM funds
      WHERE (
        COALESCE(installment1, 0) +
        COALESCE(installment2, 0) +
        COALESCE(installment3, 0) +
        COALESCE(installment4, 0) +
        COALESCE(installment5, 0)
      ) >= 5000
    `);

    res.json({
      totalUsers: allUsers.length,
      retiringSoon: retiringSoon.length,
      fullyBenefited: fullAmountPaidRows[0]?.fullAmountPaidUsers || 0
    });

  } catch (error) {
    console.error("Stats Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
