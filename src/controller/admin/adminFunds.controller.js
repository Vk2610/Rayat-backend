import db from "../../config/db.config.js";

const schemeMinimumSql = `
  CASE
    WHEN COALESCE(e.schemeType, 'Old Scheme') = 'New Scheme' THEN 5000
    ELSE 1200
  END
`;

const joiningDateSql = `
  COALESCE(
    NULLIF(CAST(e.firstJoiningDate AS CHAR), '0000-00-00'),
    NULLIF(CAST(e.branchJoiningDate AS CHAR), '0000-00-00'),
    NULLIF(CAST(e.currentAppointmentDate AS CHAR), '0000-00-00'),
    NULLIF(CAST(e.firstAppointmentDate AS CHAR), '0000-00-00')
  )
`;

const retirementDateSql = `NULLIF(CAST(e.retirementDate AS CHAR), '0000-00-00')`;

/**
 * GET USERS BASED ON FUND CONDITIONS
 * type = claimed | lowPaid
 */
export const getUsersByFundStatus = async (req, res) => {
    try {
        const { type } = req.query;

        let query = `
      SELECT 
        e.hrmsNo,
        e.employeeName,
        e.branchName,
        e.mobileNo,
        ${joiningDateSql} AS joiningDate,
        ${retirementDateSql} AS retirementDate,
        e.schemeType,

        f.installment1,
        f.installment2,
        f.installment3,
        f.installment4,
        f.installment5,

        (
            COALESCE(f.installment1,0) +
            COALESCE(f.installment2,0) +
            COALESCE(f.installment3,0) +
            COALESCE(f.installment4,0) +
            COALESCE(f.installment5,0)
        ) AS totalPaid,
        CASE
          WHEN (
            COALESCE(f.installment1,0) +
            COALESCE(f.installment2,0) +
            COALESCE(f.installment3,0) +
            COALESCE(f.installment4,0) +
            COALESCE(f.installment5,0)
          ) >= CASE
            WHEN COALESCE(e.schemeType, 'Old Scheme') = 'New Scheme' THEN 5000
            ELSE 1200
          END THEN TRUE
          ELSE FALSE
        END AS claimedFullAmount

        FROM user_profile e
        LEFT JOIN funds f ON e.hrmsNo = f.hrmsNo

    `;

        if (type === "claimed") {
            query += `
        WHERE (
          COALESCE(f.installment1,0) +
          COALESCE(f.installment2,0) +
          COALESCE(f.installment3,0) +
          COALESCE(f.installment4,0) +
          COALESCE(f.installment5,0)
        ) >= CASE
          WHEN COALESCE(e.schemeType, 'Old Scheme') = 'New Scheme' THEN 5000
          ELSE 1200
        END
      `;
        }

        // ✅ Paid < ₹5000 (regardless of claimed status, including 0 payments)
        if (type === "lowPaid") {
            query += `
        WHERE (
          COALESCE(f.installment1,0) +
          COALESCE(f.installment2,0) +
          COALESCE(f.installment3,0) +
          COALESCE(f.installment4,0) +
          COALESCE(f.installment5,0)
        ) < CASE
          WHEN COALESCE(e.schemeType, 'Old Scheme') = 'New Scheme' THEN 5000
          ELSE 1200
        END
      `;
        }

        const [rows] = await db.execute(query);

        res.status(200).json({
            success: true,
            count: rows.length,
            users: rows,
        });

    } catch (error) {
        console.error("Funds filter error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch fund users",
        });
    }
};

export const getFundDisbursementUsers = async (req, res) => {
    try {
        const query = `
      SELECT
        e.hrmsNo,
        e.employeeName,
        e.mobileNo,
        ${joiningDateSql} AS joiningDate,
        ${retirementDateSql} AS retirementDate,
        COALESCE(e.schemeType, 'Old Scheme') AS schemeType,
        COALESCE(f.installment1Date, ${joiningDateSql}) AS installment1Date,
        (
          COALESCE(f.installment1, 0) +
          COALESCE(f.installment2, 0) +
          COALESCE(f.installment3, 0) +
          COALESCE(f.installment4, 0) +
          COALESCE(f.installment5, 0)
        ) AS totalPaid
      FROM user_profile e
      LEFT JOIN funds f ON e.hrmsNo = f.hrmsNo
      WHERE e.retirementDate IS NOT NULL
        AND CAST(e.retirementDate AS CHAR) != '0000-00-00'
        AND e.retirementDate <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
        AND COALESCE(f.isClaimedBenefits, FALSE) = FALSE
      ORDER BY ${retirementDateSql} ASC, e.employeeName ASC
    `;

        const [rows] = await db.execute(query);

        res.status(200).json({
            success: true,
            count: rows.length,
            users: rows,
        });
    } catch (error) {
        console.error("Fund disbursement users error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch fund disbursement users",
        });
    }
};

export const approveFundDisbursement = async (req, res) => {
    const { meetingNo, meetingDate, checqueNo, chequeNo, usersData } = req.body;
    const effectiveChequeNo = checqueNo || chequeNo;

    if (!meetingNo || !meetingDate || !effectiveChequeNo) {
        return res.status(400).json({
            success: false,
            message: "Meeting No., Meeting Date, and Cheque Number are required",
        });
    }

    if (!Array.isArray(usersData) || usersData.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No users provided for disbursement",
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        for (const user of usersData) {
            await connection.execute(
                `
          INSERT INTO funds (hrmsNo)
          SELECT ? WHERE NOT EXISTS (
            SELECT 1 FROM funds WHERE hrmsNo = ?
          )
        `,
                [user.hrmsNo, user.hrmsNo],
            );

            await connection.execute(
                `
          UPDATE funds
          SET
            totalPayableAmt = ?,
            bonus = ?,
            meetingNo = ?,
            meetingDate = ?,
            checqueNo = ?,
            isClaimedBenefits = TRUE
          WHERE hrmsNo = ?
        `,
                [
                    user.totalPayableAmt || 0,
                    user.bonus || 0,
                    meetingNo,
                    meetingDate,
                    effectiveChequeNo,
                    user.hrmsNo,
                ],
            );
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            count: usersData.length,
            message: `Approved payable amount of ${usersData.length} users on ${meetingDate} in meeting ${meetingNo} with cheque number ${effectiveChequeNo}`,
        });
    } catch (error) {
        await connection.rollback();
        console.error("Fund disbursement approval error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to approve fund disbursement",
            details: error?.sqlMessage || error?.message,
        });
    } finally {
        connection.release();
    }
};
