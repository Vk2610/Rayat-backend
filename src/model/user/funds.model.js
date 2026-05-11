import { pool } from "../../config/db.config.js";

// ------------------------------------------
// CREATE FUNDS TABLE (foreign key = hrmsNo)
// ------------------------------------------
export async function createFundsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS funds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hrmsNo VARCHAR(20) NOT NULL,

    installment1 DECIMAL(10,2) DEFAULT 0,
    installment1Date DATETIME NULL,

    installment2 DECIMAL(10,2) DEFAULT 0,
    installment2Date DATETIME NULL,

    installment3 DECIMAL(10,2) DEFAULT 0,
    installment3Date DATETIME NULL,

    installment4 DECIMAL(10,2) DEFAULT 0,
    installment4Date DATETIME NULL,

    installment5 DECIMAL(10,2) DEFAULT 0,
    installment5Date DATETIME NULL,

    claimedFullAmount BOOLEAN DEFAULT FALSE,
    bonus DECIMAL(10,2) DEFAULT 0,
    totalPayableAmt DECIMAL(10,2) DEFAULT 0,
    meetingNo VARCHAR(100) NULL,
    checqueNo VARCHAR(100) NULL,
    meetingDate DATE NULL,
    isClaimedBenefits BOOLEAN DEFAULT FALSE
  );
  `;

  await pool.execute(query);
  await addFundsColumnIfMissing("bonus", "DECIMAL(10,2) DEFAULT 0");
  await addFundsColumnIfMissing("totalPayableAmt", "DECIMAL(10,2) DEFAULT 0");
  await addFundsColumnIfMissing("meetingNo", "VARCHAR(100) NULL");
  await addFundsColumnIfMissing("checqueNo", "VARCHAR(100) NULL");
  await addFundsColumnIfMissing("meetingDate", "DATE NULL");
  await addFundsColumnIfMissing("isClaimedBenefits", "BOOLEAN DEFAULT FALSE");
  await dropFundsForeignKeyIfExists();
  console.log("✅ funds table created successfully");
}

async function addFundsColumnIfMissing(columnName, definition) {
  const [rows] = await pool.execute(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'funds'
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [columnName],
  );

  if (!rows.length) {
    await pool.execute(`ALTER TABLE funds ADD COLUMN \`${columnName}\` ${definition}`);
  }
}

async function dropFundsForeignKeyIfExists() {
  const [rows] = await pool.execute(`
    SELECT
      CONSTRAINT_NAME AS constraintName
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'funds'
      AND COLUMN_NAME = 'hrmsNo'
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `);

  for (const foreignKey of rows) {
    await pool.execute(
      `ALTER TABLE funds DROP FOREIGN KEY \`${foreignKey.constraintName}\``
    );
  }
}

createFundsTable();

const getSchemeMinimum = async (hrmsNo) => {
  const [rows] = await pool.execute(
    `SELECT COALESCE(schemeType, 'Old Scheme') AS schemeType FROM user_profile WHERE hrmsNo = ? LIMIT 1`,
    [hrmsNo],
  );

  return rows[0]?.schemeType === "New Scheme" ? 5000 : 1200;
};

export async function createFundRecord(hrmsNo) {
  const query = `
    INSERT INTO funds (hrmsNo)
    SELECT up.hrmsNo
    FROM user_profile up
    WHERE up.hrmsNo = ?
      AND NOT EXISTS (
        SELECT 1 FROM funds WHERE hrmsNo = ?
      )
  `;

  const [result] = await pool.execute(query, [hrmsNo, hrmsNo]);

  if (result.affectedRows === 0) {
    const [profileRows] = await pool.execute(
      `SELECT hrmsNo FROM user_profile WHERE hrmsNo = ? LIMIT 1`,
      [hrmsNo],
    );

    if (!profileRows.length) {
      throw new Error(`Employee profile not found in user_profile for HRMS ${hrmsNo}`);
    }
  }

  return getFundsByHRMS(hrmsNo);
}


export async function updateInstallments(hrmsNo, data) {
  const {
    installment1, installment1Date,
    installment2, installment2Date,
    installment3, installment3Date,
    installment4, installment4Date,
    installment5, installment5Date,
    claimedFullAmount
  } = data;

  const normalizedInstallments = [
    Number(installment1) || 0,
    Number(installment2) || 0,
    Number(installment3) || 0,
    Number(installment4) || 0,
    Number(installment5) || 0,
  ];

  const totalPaid = normalizedInstallments.reduce((sum, value) => sum + value, 0);
  const schemeMinimum = await getSchemeMinimum(hrmsNo);
  const effectiveClaimedFullAmount = totalPaid >= schemeMinimum;

  const [existingRows] = await pool.execute(
    `
      SELECT id
      FROM funds
      WHERE hrmsNo = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [hrmsNo],
  );

  if (!existingRows.length) {
    await pool.execute(
      `
        INSERT INTO funds (
          hrmsNo,
          installment1, installment1Date,
          installment2, installment2Date,
          installment3, installment3Date,
          installment4, installment4Date,
          installment5, installment5Date,
          claimedFullAmount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        hrmsNo,
        installment1, installment1Date,
        installment2, installment2Date,
        installment3, installment3Date,
        installment4, installment4Date,
        installment5, installment5Date,
        effectiveClaimedFullAmount,
      ],
    );

    return getFundsByHRMS(hrmsNo);
  }

  const fundId = existingRows[0].id;

  const query = `
    UPDATE funds
    SET
      installment1 = ?, installment1Date = ?,
      installment2 = ?, installment2Date = ?,
      installment3 = ?, installment3Date = ?,
      installment4 = ?, installment4Date = ?,
      installment5 = ?, installment5Date = ?,
      claimedFullAmount = ?
    WHERE id = ?
  `;

  const values = [
    installment1, installment1Date,
    installment2, installment2Date,
    installment3, installment3Date,
    installment4, installment4Date,
    installment5, installment5Date,
    effectiveClaimedFullAmount,
    fundId,
  ];

  await pool.execute(query, values);
  return getFundsByHRMS(hrmsNo);
}



export async function getFundsByHRMS(hrmsNo) {
  const [rows] = await pool.execute(
    `
      SELECT
        f.*,
        COALESCE(up.schemeType, 'Old Scheme') AS schemeType,
        (
          COALESCE(f.installment1, 0) +
          COALESCE(f.installment2, 0) +
          COALESCE(f.installment3, 0) +
          COALESCE(f.installment4, 0) +
          COALESCE(f.installment5, 0)
        ) AS totalPaid,
        CASE
          WHEN (
            COALESCE(f.installment1, 0) +
            COALESCE(f.installment2, 0) +
            COALESCE(f.installment3, 0) +
            COALESCE(f.installment4, 0) +
            COALESCE(f.installment5, 0)
          ) >= CASE
            WHEN COALESCE(up.schemeType, 'Old Scheme') = 'New Scheme' THEN 5000
            ELSE 1200
          END THEN TRUE
          ELSE FALSE
        END AS claimedFullAmount
      FROM funds f
      LEFT JOIN user_profile up ON f.hrmsNo = up.hrmsNo
      WHERE f.hrmsNo = ?
      ORDER BY f.id DESC
      LIMIT 1
    `,
    [hrmsNo],
  );

  return rows[0] || null;
}



export async function getEmployeesWithFunds() {
  const query = `
    SELECT 
      e.*,
      f.installment1,
      f.installment2,
      f.installment3,
      f.installment4,
      f.installment5,
      f.totalAmount,
      f.claimedFullAmount
    FROM user_profile e
    LEFT JOIN funds f 
    ON e.hrmsNo = f.hrmsNo
    ORDER BY e.employeeName ASC
  `;

  const [rows] = await pool.execute(query);
  return rows;
}
