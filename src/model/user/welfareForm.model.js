import { pool } from '../../config/db.config.js';
import ensureUserProfileEmployeeStore from './userProfileEmployees.model.js';
import { createFundsTable } from './funds.model.js';
import {
  createWelfareDocsTable,
  insertWelfareDocsIntoDB,
} from './welfareDocs.model.js';

// Create WF_User Table
const createWF_UserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS wf_users (
      hrmsNo VARCHAR(20) PRIMARY KEY,
      applicantName VARCHAR(100) NOT NULL,
      branchName VARCHAR(100),
      joiningDate VARCHAR(100),
      designation VARCHAR(100),
      totalService VARCHAR(100),
      monthlySalary DECIMAL(10,2),
      mobileNo VARCHAR(15),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.execute(query);
  console.log('✅ WF_User table created');
};

// Create Patient Table
const createPatientTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS patient (
      patientId VARCHAR(255) PRIMARY KEY,
      hrmsNo VARCHAR(20) NOT NULL,
      patientName VARCHAR(100) NOT NULL,
      relation ENUM('Self', 'Spouse', 'Son', 'Daughter', 'Mother', 'Father') NOT NULL,
      illnessNature VARCHAR(200) NOT NULL,
      illnessDuration VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hrmsNo) REFERENCES wf_users(hrmsNo)
    );
  `;
  await pool.execute(query);
  console.log('✅ Patient table created');
};

// Create MedicalExpenses Table
const medicalExpensesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS medical_expenses (
      expenseId VARCHAR(255) PRIMARY KEY,
      hrmsNo VARCHAR(20) NOT NULL,
      medicineBill DECIMAL(10,2) DEFAULT 0.00,
      doctorBill DECIMAL(10,2) DEFAULT 0.00,
      otherExpenses DECIMAL(10,2) DEFAULT 0.00,
      totalExpenses DECIMAL(10,2) DEFAULT 0.0,
      certificatesAttached VARCHAR(50) DEFAULT 'होय',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hrmsNo) REFERENCES wf_users(hrmsNo)
    );
  `;
  await pool.execute(query);
  console.log('✅ MedicalExpenses table created');
};

// Create FundRequest Table
const fundRequestTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS fund_request (
      requestId VARCHAR(255) PRIMARY KEY,
      hrmsNo VARCHAR(20) NOT NULL,
      requestedAmountNumbers DECIMAL(10,2),
      requestedAmountWords VARCHAR(255),
      branchNameForDeposit VARCHAR(255),
      savingsAccountNo VARCHAR(30),
      officerRecommendation VARCHAR(300),
      applicantSignature TEXT NOT NULL,
      approvedAmount DECIMAL(10,2) DEFAULT 0.0,
      formDate VARCHAR(100) NOT NULL,
      formStatus ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
      isDeleted TINYINT(1) NOT NULL DEFAULT 0,
      rejectionReason VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hrmsNo) REFERENCES wf_users(hrmsNo)
    );
  `;
  await pool.execute(query);
  console.log('✅ FundRequest table created');
};

const ensureFundRequestSoftDeleteColumn = async () => {
  const [rows] = await pool.execute(`
    SHOW COLUMNS FROM fund_request LIKE 'isDeleted'
  `);

  if (!rows.length) {
    await pool.execute(`
      ALTER TABLE fund_request
      ADD COLUMN isDeleted TINYINT(1) NOT NULL DEFAULT 0
    `);
    console.log('âœ… fund_request.isDeleted column added');
  }
};

const ensureFundRequestApprovedAmountDateColumn = async () => {
  const [rows] = await pool.execute(`
    SHOW COLUMNS FROM fund_request LIKE 'approvedAmountDate'
  `);

  if (!rows.length) {
    await pool.execute(`
      ALTER TABLE fund_request
      ADD COLUMN approvedAmountDate DATETIME NULL
    `);
    console.log('fund_request.approvedAmountDate column added');
  }

  await pool.execute(`
    UPDATE fund_request
    SET approvedAmountDate = created_at
    WHERE COALESCE(approvedAmount, 0) > 0
      AND approvedAmountDate IS NULL
      AND COALESCE(isDeleted, 0) = 0
  `);
};

// Create PreviousFund Table
const previousFundTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS previous_fund (
      previousId VARCHAR(255) PRIMARY KEY,
      hrmsNo VARCHAR(20) NOT NULL,
      previousHelpDetails VARCHAR(255),
      annualDeductions VARCHAR(50) DEFAULT 'होय',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hrmsNo) REFERENCES wf_users(hrmsNo)
    );
  `;
  await pool.execute(query);
  console.log('✅ PreviousFund table created');
};

const ensureFundRequestRejectionReasonColumn = async () => {
  const [rows] = await pool.execute(`
    SHOW COLUMNS FROM fund_request LIKE 'rejectionReason'
  `);

  if (!rows.length) {
    await pool.execute(`
      ALTER TABLE fund_request
      ADD COLUMN rejectionReason VARCHAR(500) NULL
    `);
    console.log('✅ fund_request.rejectionReason column added');
  }
};

// Run all table creations
export const createAllTables = async () => {
  try {
    await createWF_UserTable();
    await createPatientTable();
    await medicalExpensesTable();
    await fundRequestTable();
    await ensureFundRequestSoftDeleteColumn();
    await ensureFundRequestApprovedAmountDateColumn();
    await ensureFundRequestRejectionReasonColumn();
    await previousFundTable();
    await createWelfareDocsTable();
    await ensureUserProfileEmployeeStore();
    await createFundsTable();
    console.log('🎉 All tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
};

export {
  createWF_UserTable,
  createPatientTable,
  medicalExpensesTable,
  fundRequestTable,
  previousFundTable,
};

// ---------------------------------------------------------
// 1️⃣ Insert into WF_Users
// ---------------------------------------------------------
const insertUser = async (connection, formData) => {
  try {
    const checkUserQuery = `
      SELECT applicantName FROM wf_users WHERE hrmsNo = ?
    `;

    const rows = await connection.execute(checkUserQuery, [formData.hrmsNo]);

    if (rows[0].length !== 0) {
      console.log('wf user already exists');
      return;
    }

    const query = `
    INSERT INTO wf_users (
      hrmsNo, applicantName, branchName, joiningDate, designation,
      totalService, monthlySalary, mobileNo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
      formData.hrmsNo,
      formData.applicantName,
      formData.branchName,
      formData.joiningDate,
      formData.designation,
      formData.totalService,
      formData.monthlySalary,
      formData.mobileNo,
    ];

    await connection.execute(query, values);
  } catch (error) {
    console.log('error at insertUser: ', error);
    throw error;
  }
};

// ---------------------------------------------------------
// 2️⃣ Insert into Patient
// ---------------------------------------------------------
const insertPatient = async (connection, formData) => {
  try {
    const query = `
    INSERT INTO patient (
      patientId, hrmsNo, patientName, relation, illnessNature, illnessDuration
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

    const values = [
      formData.patientId,
      formData.hrmsNo,
      formData.patientName,
      formData.relation,
      formData.illnessNature,
      formData.illnessDuration,
    ];

    await connection.execute(query, values);
  } catch (error) {
    console.log('error at insertPatient: ', error);
    throw error;
  }
};

// ---------------------------------------------------------
// 3️⃣ Insert into Medical_Expenses
// ---------------------------------------------------------
const insertMedicalExpenses = async (connection, formData) => {
  try {
    const query = `
      INSERT INTO medical_expenses (
        expenseId, hrmsNo, medicineBill, doctorBill, otherExpenses, totalExpenses, certificatesAttached
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      formData.expensesId,
      formData.hrmsNo,
      formData.medicineBill,
      formData.doctorBill,
      formData.otherExpenses,
      formData.totalExpenses,
      formData.certificatesAttached,
    ];

    await connection.execute(query, values);
  } catch (error) {
    console.log('error at insertMedicalExpenses: ', error);
    throw error;
  }
};

// ---------------------------------------------------------
// 4️⃣ Insert into Fund_Request
// ---------------------------------------------------------
const insertFundRequest = async (connection, formData) => {
  try {
    const query = `
    INSERT INTO fund_request (
      requestId, hrmsNo, requestedAmountNumbers, requestedAmountWords,
      branchNameForDeposit, savingsAccountNo, officerRecommendation,
      applicantSignature, formDate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
      formData.requestId,
      formData.hrmsNo,
      formData.requestedAmountNumbers,
      formData.requestedAmountWords,
      formData.branchNameForDeposit,
      formData.savingsAccountNo,
      formData.officerRecommendation,
      formData.applicantSignature,
      formData.formDate,
    ];

    await connection.execute(query, values);
  } catch (error) {
    console.log('error at insertFundRequest: ', error);
    throw error;
  }
};

// ---------------------------------------------------------
// 5️⃣ Insert into Previous_Fund (optional — only if data exists)
// ---------------------------------------------------------
const insertPreviousFund = async (connection, formData) => {
  if (!formData.previousHelp || formData.previousHelp === 'नाही') {
    console.log('no previous fund, no prevfund record inserted');
    return;
  }

  try {
    const query = `
    INSERT INTO previous_fund (
      previousId, hrmsNo, previousHelpDetails,
      annualDeductions
    ) VALUES (?, ?, ?, ?)
  `;

    const values = [
      formData.previousId,
      formData.hrmsNo,
      formData.previousHelpDetails,
      formData.annualDeductions,
    ];

    await connection.execute(query, values);
  } catch (error) {
    console.log('error at insertPreviousFund: ', error);
    throw error;
  }
};

// ---------------------------------------------------------
// 🌟 Master Transaction Controller
// ---------------------------------------------------------
export const insertWelfareFormData = async (req, res) => {
  const formData = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await insertUser(connection, formData);
    await insertPatient(connection, formData);
    await insertMedicalExpenses(connection, formData);
    await insertFundRequest(connection, formData);
    await insertPreviousFund(connection, formData);
    await insertWelfareDocsIntoDB(connection, formData);

    await connection.commit();

    console.log('✅ All form data inserted successfully!');
    return res.status(201).json({
      message: '✅ Welfare form submitted successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Transaction failed:', error);
    return res
      .status(500)
      .json({ error: 'Transaction failed, all changes rolled back' });
  } finally {
    connection.release();
  }
};

export const updateWelfareFormData = async (req, res) => {
  const { requestId } = req.params;
  const formData = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get current form's hrmsNo and created_at
    const [rows] = await connection.execute(
      `
        SELECT hrmsNo, created_at
        FROM fund_request
        WHERE requestId = ?
          AND COALESCE(isDeleted, 0) = 0
        LIMIT 1
      `,
      [requestId],
    );

    if (!rows.length) {
      connection.release();
      return res.status(404).json({ error: 'Form not found or deleted.' });
    }

    const targetForm = rows[0];
    const hrmsNo = targetForm.hrmsNo;

    // 2. Determine position among forms of the user
    const [positionRows] = await connection.execute(
      `
        SELECT COUNT(*) AS position
        FROM fund_request
        WHERE hrmsNo = ?
          AND COALESCE(isDeleted, 0) = 0
          AND created_at <= ?
      `,
      [hrmsNo, targetForm.created_at],
    );
    const formPosition = positionRows[0]?.position ?? 0;

    // 3. Update wf_users
    await connection.execute(
      `
        UPDATE wf_users SET
          applicantName = ?,
          branchName = ?,
          joiningDate = ?,
          designation = ?,
          totalService = ?,
          monthlySalary = ?,
          mobileNo = ?
        WHERE hrmsNo = ?
      `,
      [
        formData.applicantName,
        formData.branchName,
        formData.joiningDate,
        formData.designation,
        formData.totalService,
        formData.monthlySalary,
        formData.mobileNo,
        hrmsNo,
      ]
    );

    // 4. Update patient (using ranked position)
    if (formPosition > 0) {
      const [patientRows] = await connection.execute(
        `
          SELECT patientId
          FROM (
            SELECT
              patientId,
              ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS row_num
            FROM patient
            WHERE hrmsNo = ?
          ) ranked_patient
          WHERE row_num = ?
        `,
        [hrmsNo, formPosition],
      );
      const patientId = patientRows[0]?.patientId;
      if (patientId) {
        await connection.execute(
          `
            UPDATE patient SET
              patientName = ?,
              relation = ?,
              illnessNature = ?,
              illnessDuration = ?
            WHERE patientId = ?
          `,
          [
            formData.patientName,
            formData.relation,
            formData.illnessNature,
            formData.illnessDuration,
            patientId,
          ]
        );
      }
    }

    // 5. Update medical_expenses (using ranked position)
    if (formPosition > 0) {
      const [expenseRows] = await connection.execute(
        `
          SELECT expenseId
          FROM (
            SELECT
              expenseId,
              ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS row_num
            FROM medical_expenses
            WHERE hrmsNo = ?
          ) ranked_expenses
          WHERE row_num = ?
        `,
        [hrmsNo, formPosition],
      );
      const expenseId = expenseRows[0]?.expenseId;
      if (expenseId) {
        await connection.execute(
          `
            UPDATE medical_expenses SET
              medicineBill = ?,
              doctorBill = ?,
              otherExpenses = ?,
              totalExpenses = ?,
              certificatesAttached = ?
            WHERE expenseId = ?
          `,
          [
            formData.medicineBill,
            formData.doctorBill,
            formData.otherExpenses,
            formData.totalExpenses,
            formData.certificatesAttached,
            expenseId,
          ]
        );
      }
    }

    // 6. Update previous_fund (using ranked position)
    if (formPosition > 0) {
      const [previousRows] = await connection.execute(
        `
          SELECT previousId
          FROM (
            SELECT
              previousId,
              ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS row_num
            FROM previous_fund
            WHERE hrmsNo = ?
          ) ranked_previous
          WHERE row_num = ?
        `,
        [hrmsNo, formPosition],
      );
      const previousId = previousRows[0]?.previousId;

      if (previousId) {
        if (!formData.previousHelp || formData.previousHelp === 'नाही') {
          // Delete if no longer needed
          await connection.execute(
            `DELETE FROM previous_fund WHERE previousId = ?`,
            [previousId]
          );
        } else {
          // Update existing
          await connection.execute(
            `
              UPDATE previous_fund SET
                previousHelpDetails = ?,
                annualDeductions = ?
              WHERE previousId = ?
            `,
            [formData.previousHelpDetails, formData.annualDeductions, previousId]
          );
        }
      } else if (formData.previousHelp && formData.previousHelp === 'होय') {
        // Insert new since it was 'होय' but not in DB
        const newPreviousId = uuidv4();
        await connection.execute(
          `
            INSERT INTO previous_fund (
              previousId, hrmsNo, previousHelpDetails, annualDeductions
            ) VALUES (?, ?, ?, ?)
          `,
          [newPreviousId, hrmsNo, formData.previousHelpDetails, formData.annualDeductions]
        );
      }
    }

    // 7. Update welfareDocs
    await connection.execute(
      `
        UPDATE welfareDocs SET
          dischargeCertificate = ?,
          doctorPrescription = ?,
          medicineBills = ?,
          diagnosticReports = ?,
          otherDoc1 = ?,
          otherDoc2 = ?,
          otherDoc3 = ?,
          otherDoc4 = ?,
          otherDoc5 = ?
        WHERE fundId = ?
      `,
      [
        formData.dischargeCertificate || null,
        formData.doctorPrescription || null,
        formData.medicineBills || null,
        formData.diagnosticReports || null,
        formData.otherDoc1 || null,
        formData.otherDoc2 || null,
        formData.otherDoc3 || null,
        formData.otherDoc4 || null,
        formData.otherDoc5 || null,
        requestId,
      ]
    );

    // 8. Update fund_request
    await connection.execute(
      `
        UPDATE fund_request SET
          requestedAmountNumbers = ?,
          requestedAmountWords = ?,
          branchNameForDeposit = ?,
          savingsAccountNo = ?,
          officerRecommendation = ?,
          applicantSignature = ?,
          formStatus = 'Pending',
          rejectionReason = NULL
        WHERE requestId = ?
      `,
      [
        formData.requestedAmountNumbers,
        formData.requestedAmountWords,
        formData.branchNameForDeposit,
        formData.savingsAccountNo,
        formData.officerRecommendation,
        formData.applicantSignature,
        requestId,
      ]
    );

    await connection.commit();
    console.log('✅ Form data updated successfully!');
    return res.status(200).json({
      message: '✅ Welfare form updated and reapplied successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Transaction failed:', error);
    return res
      .status(500)
      .json({ error: 'Transaction failed, all changes rolled back' });
  } finally {
    connection.release();
  }
};

export const updateStatus = async (id, status, rejectionReason = null) => {
  const connection = await pool.getConnection();

  try {
    let query;
    let values;
    if (status === 'Rejected') {
      query = `
        UPDATE fund_request SET formStatus = ?, rejectionReason = ? WHERE requestId = ? AND COALESCE(isDeleted, 0) = 0
      `;
      values = [status, rejectionReason, id];
    } else {
      query = `
        UPDATE fund_request SET formStatus = ?, rejectionReason = NULL WHERE requestId = ? AND COALESCE(isDeleted, 0) = 0
      `;
      values = [status, id];
    }

    await connection.execute(query, values);
  } catch (error) {
    console.error('Error occured while updating status: ', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const updateApprAmt = async (id, amt) => {
  const connection = await pool.getConnection();

  try {
    const amount = Number(amt);
    const query = `
      UPDATE fund_request SET approvedAmount = ? WHERE requestId = ? AND COALESCE(isDeleted, 0) = 0
    `;

    const values = [amount, id];

    await connection.execute(query, values);
  } catch (error) {
    console.error('Error occured while updating status: ', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const getAllForms = async ({ page = 1, limit = 10 } = {}) => {
  const connection = await pool.getConnection();
  const pg = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.max(parseInt(limit, 10) || 10, 1);
  const offset = (pg - 1) * lim;

  console.log('lim type:', typeof lim, 'offset type:', typeof offset);

  try {
    // Count total pending forms
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM fund_request
      WHERE formStatus = 'Pending' AND COALESCE(isDeleted, 0) = 0
    `;
    const [countRows] = await connection.execute(countQuery);
    const total = countRows[0]?.total ?? 0;

    // Fetch pending forms
    const dataQuery = `
      SELECT
        wf.applicantName,
        wf.branchName,
        wf.joiningDate,
        wf.designation,
        wf.totalService,
        wf.monthlySalary,
        wf.mobileNo AS mobile,
        fr.requestId,
        fr.hrmsNo,
        fr.requestedAmountNumbers,
        fr.requestedAmountWords,
        fr.branchNameForDeposit,
        fr.savingsAccountNo,
        fr.officerRecommendation,
        fr.applicantSignature,
        fr.formDate,
        fr.formStatus,
        fr.rejectionReason,
        fr.created_at,

        p.patientId,
        p.patientName,
        p.relation,
        p.illnessNature,
        p.illnessDuration,

        me.medicineBill,
        me.doctorBill,
        me.otherExpenses,
        me.totalExpenses,
        me.certificatesAttached,

        pf.previousHelpDetails,
        pf.annualDeductions,
        CASE WHEN pf.previousId IS NOT NULL THEN 'होय' ELSE 'नाही' END AS previousHelp,

        wd.dischargeCertificate,
        wd.doctorPrescription,
        wd.medicineBills AS docsMedicineBills,
        wd.diagnosticReports,
        wd.otherDoc1,
        wd.otherDoc2,
        wd.otherDoc3,
        wd.otherDoc4,
        wd.otherDoc5

      FROM fund_request fr
      JOIN wf_users wf ON fr.hrmsNo = wf.hrmsNo
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM patient
      ) p ON fr.hrmsNo = p.hrmsNo
        AND p.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM medical_expenses
      ) me ON fr.hrmsNo = me.hrmsNo
        AND me.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM previous_fund
      ) pf ON fr.hrmsNo = pf.hrmsNo
        AND pf.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      LEFT JOIN welfareDocs wd ON fr.requestId = wd.fundId

      WHERE fr.formStatus = 'Pending'
        AND COALESCE(fr.isDeleted, 0) = 0
      ORDER BY fr.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `;

    const [rows] = await connection.execute(dataQuery);

    return {
      total,
      page: pg,
      limit: lim,
      forms: rows,
    };
  } catch (error) {
    console.error('Error retrieving forms: ', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const getAllFormsOfUser = async (hrmsNo) => {
  const connection = await pool.getConnection();

  try {
    const query = `
      SELECT 
        fr.requestId,
        u.applicantName,
        u.branchName,
        u.joiningDate,
        u.designation,
        u.totalService,
        u.monthlySalary,
        u.mobileNo AS mobile,
        fr.hrmsNo,
        fr.requestedAmountNumbers,
        fr.requestedAmountWords,
        fr.branchNameForDeposit,
        fr.savingsAccountNo,
        fr.officerRecommendation,
        fr.applicantSignature,
        fr.approvedAmount,
        fr.formDate,
        fr.formStatus,
        fr.rejectionReason,
        fr.created_at,

        p.patientId,
        p.patientName,
        p.relation,
        p.illnessNature,
        p.illnessDuration,
        
        me.medicineBill,
        me.doctorBill,
        me.otherExpenses,
        me.totalExpenses,
        me.certificatesAttached,
        
        pf.previousHelpDetails,
        pf.annualDeductions,
        CASE WHEN pf.previousId IS NOT NULL THEN 'होय' ELSE 'नाही' END AS previousHelp,

        wd.dischargeCertificate,
        wd.doctorPrescription,
        wd.medicineBills AS docsMedicineBills,
        wd.diagnosticReports,
        wd.otherDoc1,
        wd.otherDoc2,
        wd.otherDoc3,
        wd.otherDoc4,
        wd.otherDoc5

      FROM fund_request fr
      JOIN wf_users u ON fr.hrmsNo = u.hrmsNo
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM patient
      ) p ON fr.hrmsNo = p.hrmsNo
        AND p.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM medical_expenses
      ) me ON fr.hrmsNo = me.hrmsNo
        AND me.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM previous_fund
      ) pf ON fr.hrmsNo = pf.hrmsNo
        AND pf.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      LEFT JOIN welfareDocs wd ON fr.requestId = wd.fundId
      WHERE fr.hrmsNo = ?
        AND COALESCE(fr.isDeleted, 0) = 0
      ORDER BY fr.created_at DESC
    `;

    const [rows] = await connection.execute(query, [hrmsNo]);
    return rows;
  } catch (error) {
    console.error('Error retrieving forms of the user: ', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const getApprovedNoAmtForms = async () => {
  const connection = await pool.getConnection();

  try {
    const dataQuery = `
      SELECT
        wf.applicantName,
        fr.requestId,
        fr.hrmsNo,
        wf.mobileNo AS mobile,
        me.totalExpenses,
        fr.requestedAmountNumbers,
        fr.formDate
      FROM fund_request fr
      JOIN wf_users wf ON fr.hrmsNo = wf.hrmsNo
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM medical_expenses
      ) me ON fr.hrmsNo = me.hrmsNo
        AND me.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      WHERE fr.formStatus = 'Approved'
        AND COALESCE(fr.isDeleted, 0) = 0
        AND (fr.approvedAmount = 0 OR fr.approvedAmount IS NULL)
      ORDER BY fr.created_at ASC
    `;

    const [rows] = await connection.execute(dataQuery);
    return { forms: rows };
  } catch (error) {
    console.error('Error retrieving forms: ', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const getUsers = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const connection = await pool.getConnection();
  const pg = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.max(parseInt(limit, 10) || 10, 1);
  const offset = (pg - 1) * lim;
  const searchParam = `%${search.trim()}%`;

  try {
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM (
        SELECT DISTINCT u.hrmsNo
        FROM wf_users u
        JOIN fund_request fr ON fr.hrmsNo = u.hrmsNo
        WHERE COALESCE(fr.isDeleted, 0) = 0
          AND (u.applicantName LIKE ? OR u.hrmsNo LIKE ?)
      ) AS matching_users
    `;
    const [countRows] = await connection.execute(countQuery, [
      searchParam,
      searchParam,
    ]);
    const total = countRows[0]?.total ?? 0;

    const dataQuery = `
      SELECT 
        u.hrmsNo,
        u.applicantName,
        MAX(fr.created_at) AS created_at
      FROM wf_users u
      JOIN fund_request fr ON fr.hrmsNo = u.hrmsNo
      WHERE COALESCE(fr.isDeleted, 0) = 0
        AND (u.applicantName LIKE ? OR u.hrmsNo LIKE ?)
      GROUP BY u.hrmsNo, u.applicantName
      ORDER BY created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `;
    const [rows] = await connection.execute(dataQuery, [
      searchParam,
      searchParam,
    ]);

    return {
      total,
      page: pg,
      limit: lim,
      users: rows,
    };
  } catch (error) {
    console.error('Error retrieving paginated users:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const getFormByRequestId = async (requestId) => {
  const connection = await pool.getConnection();
  try {
    const query = `
      SELECT
        wf.applicantName,
        wf.branchName,
        wf.joiningDate,
        wf.designation,
        wf.totalService,
        wf.monthlySalary,
        wf.mobileNo,

        fr.requestId,
        fr.hrmsNo,
        fr.requestedAmountNumbers,
        fr.requestedAmountWords,
        fr.branchNameForDeposit,
        fr.savingsAccountNo,
        fr.officerRecommendation,
        fr.applicantSignature,
        fr.formDate,
        fr.formStatus,
        fr.rejectionReason,
        fr.sanctionLetter,

        p.patientName,
        p.relation,
        p.illnessNature,
        p.illnessDuration,

        me.medicineBill,
        me.doctorBill,
        me.otherExpenses,
        me.totalExpenses,
        me.certificatesAttached,

        pf.previousHelpDetails,
        pf.annualDeductions,
        CASE WHEN pf.previousId IS NOT NULL THEN 'होय' ELSE 'नाही' END AS previousHelp,

        wd.dischargeCertificate,
        wd.doctorPrescription,
        wd.medicineBills AS docsMedicineBills,
        wd.diagnosticReports,
        wd.otherDoc1,
        wd.otherDoc2,
        wd.otherDoc3,
        wd.otherDoc4,
        wd.otherDoc5

      FROM fund_request fr
      JOIN wf_users wf ON fr.hrmsNo = wf.hrmsNo
      LEFT JOIN patient p ON fr.requestId = p.hrmsNo
        OR p.hrmsNo = fr.hrmsNo
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM patient
      ) pa ON fr.hrmsNo = pa.hrmsNo
        AND pa.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM medical_expenses
      ) me ON fr.hrmsNo = me.hrmsNo
        AND me.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM previous_fund
      ) pf ON fr.hrmsNo = pf.hrmsNo
        AND pf.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      LEFT JOIN welfareDocs wd ON fr.requestId = wd.fundId

      WHERE fr.requestId = ?
        AND COALESCE(fr.isDeleted, 0) = 0
      LIMIT 1
    `;
    const [rows] = await connection.execute(query, [requestId]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching form by requestId:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const getApplicationsByStatus = async ({
  status,
  search = '',
  sortBy = 'formDate',
  sortOrder = 'desc',
  approvedAmountMax,
  minRequestedAmount,
  zone,
} = {}) => {
  const connection = await pool.getConnection();

  const normalizedStatus =
    String(status || '')
      .charAt(0)
      .toUpperCase() +
    String(status || '')
      .slice(1)
      .toLowerCase();
  const searchTerm = `%${String(search || '').trim()}%`;
  const allowedSortFields = {
    hrmsNo: 'fr.hrmsNo',
    username: 'wf.applicantName',
    formDate: 'fr.created_at',
    requestedAmount: 'fr.requestedAmountNumbers',
    approvedAmount: 'fr.approvedAmount',
    totalExpenditure: 'me.totalExpenses',
  };
  const orderByColumn = allowedSortFields[sortBy] || allowedSortFields.formDate;
  const orderDirection =
    String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const hasApprovedAmountMax =
    approvedAmountMax !== undefined &&
    approvedAmountMax !== null &&
    approvedAmountMax !== '';
  const hasMinRequestedAmount =
    minRequestedAmount !== undefined &&
    minRequestedAmount !== null &&
    minRequestedAmount !== '';
  const hasZone = Boolean(String(zone || '').trim());

  try {
    const query = `
      SELECT
        fr.requestId AS id,
        fr.hrmsNo,
        wf.applicantName AS username,
        wf.mobileNo AS mobileNo,
        up.branchRegionName AS zone,
        me.totalExpenses AS totalExpenditure,
        fr.requestedAmountNumbers AS requestedAmount,
        fr.approvedAmount AS approvedAmount,
        fr.formDate,
        fr.rejectionReason,
        fr.created_at
      FROM fund_request fr
      JOIN wf_users wf ON fr.hrmsNo = wf.hrmsNo
      LEFT JOIN user_profile up ON fr.hrmsNo = up.hrmsNo
      LEFT JOIN (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS rn
        FROM medical_expenses
      ) me ON fr.hrmsNo = me.hrmsNo
        AND me.rn = (
          SELECT COUNT(*) FROM fund_request fr2
          WHERE fr2.hrmsNo = fr.hrmsNo
            AND fr2.created_at <= fr.created_at
        )
      WHERE fr.formStatus = ?
        AND COALESCE(fr.isDeleted, 0) = 0
        AND (
          ? = '%%'
          OR wf.applicantName LIKE ?
          OR fr.hrmsNo LIKE ?
        )
        ${hasApprovedAmountMax ? 'AND COALESCE(fr.approvedAmount, 0) <= ?' : ''}
        ${hasMinRequestedAmount ? 'AND COALESCE(fr.requestedAmountNumbers, 0) >= ?' : ''}
        ${hasZone ? 'AND up.branchRegionName = ?' : ''}
      ORDER BY ${orderByColumn} ${orderDirection}
    `;

    const params = [normalizedStatus, searchTerm, searchTerm, searchTerm];

    if (hasApprovedAmountMax) {
      params.push(Number(approvedAmountMax));
    }
    if (hasMinRequestedAmount) {
      params.push(Number(minRequestedAmount));
    }
    if (hasZone) {
      params.push(zone);
    }

    const [rows] = await connection.execute(query, params);

    return rows;
  } catch (error) {
    console.error('Error retrieving applications by status:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const getApprovedAmountReportApplications = async ({
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'approvedAmountDate',
  sortOrder = 'desc',
  approvedDateFrom,
  approvedDateTo,
  minRequestedAmount,
  zone,
} = {}) => {
  const connection = await pool.getConnection();
  const pg = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.max(parseInt(limit, 10) || 10, 1);
  const offset = (pg - 1) * lim;
  const searchTerm = `%${String(search || '').trim()}%`;
  const allowedSortFields = {
    hrmsNo: 'fr.hrmsNo',
    username: 'wf.applicantName',
    requestedAmount: 'fr.requestedAmountNumbers',
    approvedAmount: 'fr.approvedAmount',
    approvedAmountDate: 'fr.approvedAmountDate',
  };
  const orderByColumn =
    allowedSortFields[sortBy] || allowedSortFields.approvedAmountDate;
  const orderDirection =
    String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const hasApprovedDateFrom = Boolean(String(approvedDateFrom || '').trim());
  const hasApprovedDateTo = Boolean(String(approvedDateTo || '').trim());
  const hasMinRequestedAmount =
    minRequestedAmount !== undefined &&
    minRequestedAmount !== null &&
    minRequestedAmount !== '';
  const hasZone = Boolean(String(zone || '').trim());

  try {
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM fund_request fr
      JOIN wf_users wf ON fr.hrmsNo = wf.hrmsNo
      LEFT JOIN user_profile up ON fr.hrmsNo = up.hrmsNo
      WHERE fr.formStatus = 'Approved'
        AND COALESCE(fr.isDeleted, 0) = 0
        AND COALESCE(fr.approvedAmount, 0) > 0
        AND (
          ? = '%%'
          OR wf.applicantName LIKE ?
          OR fr.hrmsNo LIKE ?
          OR wf.mobileNo LIKE ?
        )
        ${hasApprovedDateFrom ? 'AND DATE(fr.approvedAmountDate) >= ?' : ''}
        ${hasApprovedDateTo ? 'AND DATE(fr.approvedAmountDate) <= ?' : ''}
        ${hasMinRequestedAmount ? 'AND COALESCE(fr.requestedAmountNumbers, 0) >= ?' : ''}
        ${hasZone ? 'AND up.branchRegionName = ?' : ''}
    `;

    const countParams = [searchTerm, searchTerm, searchTerm, searchTerm];
    if (hasApprovedDateFrom) countParams.push(approvedDateFrom);
    if (hasApprovedDateTo) countParams.push(approvedDateTo);
    if (hasMinRequestedAmount) countParams.push(Number(minRequestedAmount));
    if (hasZone) countParams.push(zone);
    const [countRows] = await connection.execute(countQuery, countParams);
    const total = countRows[0]?.total ?? 0;

    const query = `
      SELECT
        fr.requestId AS id,
        fr.requestId,
        fr.hrmsNo,
        wf.applicantName AS username,
        wf.mobileNo AS phoneNo,
        up.branchRegionName AS zone,
        fr.requestedAmountNumbers AS requestedAmount,
        fr.approvedAmount AS approvedAmount,
        fr.approvedAmountDate,
        fr.savingsAccountNo,
        fr.formDate
      FROM fund_request fr
      JOIN wf_users wf ON fr.hrmsNo = wf.hrmsNo
      LEFT JOIN user_profile up ON fr.hrmsNo = up.hrmsNo
      WHERE fr.formStatus = 'Approved'
        AND COALESCE(fr.isDeleted, 0) = 0
        AND COALESCE(fr.approvedAmount, 0) > 0
        AND (
          ? = '%%'
          OR wf.applicantName LIKE ?
          OR fr.hrmsNo LIKE ?
          OR wf.mobileNo LIKE ?
        )
        ${hasApprovedDateFrom ? 'AND DATE(fr.approvedAmountDate) >= ?' : ''}
        ${hasApprovedDateTo ? 'AND DATE(fr.approvedAmountDate) <= ?' : ''}
        ${hasMinRequestedAmount ? 'AND COALESCE(fr.requestedAmountNumbers, 0) >= ?' : ''}
        ${hasZone ? 'AND up.branchRegionName = ?' : ''}
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT ${lim} OFFSET ${offset}
    `;

    const params = [searchTerm, searchTerm, searchTerm, searchTerm];
    if (hasApprovedDateFrom) params.push(approvedDateFrom);
    if (hasApprovedDateTo) params.push(approvedDateTo);
    if (hasMinRequestedAmount) params.push(Number(minRequestedAmount));
    if (hasZone) params.push(zone);
    const [applications] = await connection.execute(query, params);

    return {
      applications,
      pagination: {
        page: pg,
        limit: lim,
        total,
        totalPages: Math.max(1, Math.ceil(total / lim)),
      },
    };
  } catch (error) {
    console.error('Error retrieving report applications:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const updateApprovedAmountByRequestId = async (
  requestId,
  approvedAmount,
  approvedDate,
) => {
  const connection = await pool.getConnection();

  try {
    const numericAmount = Number(approvedAmount);

    if (Number.isNaN(numericAmount)) {
      throw new Error('Approved amount must be numeric.');
    }

    if (numericAmount < 0) {
      throw new Error('Approved amount cannot be negative.');
    }

    const [rows] = await connection.execute(
      `
        SELECT requestId, requestedAmountNumbers, formStatus
        FROM fund_request
        WHERE requestId = ?
          AND COALESCE(isDeleted, 0) = 0
        LIMIT 1
      `,
      [requestId],
    );

    const application = rows[0];

    if (!application) {
      throw new Error('Application not found.');
    }

    if (application.formStatus !== 'Approved') {
      throw new Error(
        'Approved amount can only be updated for approved applications.',
      );
    }

    if (numericAmount > Number(application.requestedAmountNumbers || 0)) {
      throw new Error('Approved amount cannot exceed requested amount.');
    }

    // If approvedDate is provided, use it. Otherwise, if amount > 0, use current time.
    let finalApprovedDate = approvedDate;
    if (!finalApprovedDate && numericAmount > 0) {
      finalApprovedDate = new Date();
    } else if (numericAmount === 0) {
      finalApprovedDate = null;
    }

    await connection.execute(
      `
        UPDATE fund_request
        SET approvedAmount = ?,
            approvedAmountDate = ?
        WHERE requestId = ?
          AND COALESCE(isDeleted, 0) = 0
      `,
      [numericAmount, finalApprovedDate, requestId],
    );

    const [updatedRows] = await connection.execute(
      `
        SELECT
          requestId AS id,
          hrmsNo,
          requestedAmountNumbers AS requestedAmount,
          approvedAmount,
          approvedAmountDate,
          formDate
        FROM fund_request
        WHERE requestId = ?
          AND COALESCE(isDeleted, 0) = 0
        LIMIT 1
      `,
      [requestId],
    );

    return updatedRows[0];
  } catch (error) {
    console.error('Error updating approved amount by request id:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteFormByRequestId = async (requestId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `
        SELECT requestId, hrmsNo, created_at
        FROM fund_request
        WHERE requestId = ?
          AND COALESCE(isDeleted, 0) = 0
        LIMIT 1
      `,
      [requestId],
    );

    if (!rows.length) {
      throw new Error('Form not found.');
    }

    const targetForm = rows[0];
    const [positionRows] = await connection.execute(
      `
        SELECT COUNT(*) AS position
        FROM fund_request
        WHERE hrmsNo = ?
          AND COALESCE(isDeleted, 0) = 0
          AND created_at <= ?
      `,
      [targetForm.hrmsNo, targetForm.created_at],
    );

    const formPosition = positionRows[0]?.position ?? 0;

    await connection.execute(
      `
        DELETE FROM welfareDocs
        WHERE fundId = ?
      `,
      [requestId],
    );

    if (formPosition > 0) {
      await connection.execute(
        `
          DELETE FROM patient
          WHERE patientId IN (
            SELECT patientId
            FROM (
              SELECT
                patientId,
                ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS row_num
              FROM patient
              WHERE hrmsNo = ?
            ) ranked_patient
            WHERE row_num = ?
          )
        `,
        [targetForm.hrmsNo, formPosition],
      );

      await connection.execute(
        `
          DELETE FROM medical_expenses
          WHERE expenseId IN (
            SELECT expenseId
            FROM (
              SELECT
                expenseId,
                ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS row_num
              FROM medical_expenses
              WHERE hrmsNo = ?
            ) ranked_expenses
            WHERE row_num = ?
          )
        `,
        [targetForm.hrmsNo, formPosition],
      );

      await connection.execute(
        `
          DELETE FROM previous_fund
          WHERE previousId IN (
            SELECT previousId
            FROM (
              SELECT
                previousId,
                ROW_NUMBER() OVER (PARTITION BY hrmsNo ORDER BY created_at ASC) AS row_num
              FROM previous_fund
              WHERE hrmsNo = ?
            ) ranked_previous
            WHERE row_num = ?
          )
        `,
        [targetForm.hrmsNo, formPosition],
      );
    }

    await connection.execute(
      `
        DELETE FROM fund_request
        WHERE requestId = ?
      `,
      [requestId],
    );

    await connection.commit();
    return { requestId };
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting form by request id:', error);
    throw error;
  } finally {
    connection.release();
  }
};
