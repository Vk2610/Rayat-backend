import { pool } from '../../config/db.config.js';
import { v4 as uuidv4 } from 'uuid';

// Create welfareDocs table
export const createWelfareDocsTable = async () => {
  const query = `
  CREATE TABLE IF NOT EXISTS welfareDocs (
    docsId varchar(255) PRIMARY KEY,
    hrmsNo varchar(255) NOT NULL,
    fundId varchar(255) NOT NULL,
    dischargeCertificate TEXT,
    doctorPrescription TEXT,
    medicineBills TEXT,
    diagnosticReports TEXT,
    otherDoc1 TEXT NULL,
    otherDoc2 TEXT NULL,
    otherDoc3 TEXT NULL,
    otherDoc4 TEXT NULL,
    otherDoc5 TEXT NULL,
    FOREIGN KEY (hrmsNo) REFERENCES wf_users(hrmsNo),
    FOREIGN KEY (fundId) REFERENCES fund_request(requestId),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`;
  await pool.execute(query);
  console.log("✅ welfareDocs table created");
};

export const insertWelfareDocsIntoDB = async (connection, docs) => {
  const id = uuidv4();

  const safe = (v) => (v === undefined ? null : v);

  const query = `
    INSERT INTO welfareDocs (
      docsId, hrmsNo, fundId, dischargeCertificate,
      doctorPrescription, medicineBills, diagnosticReports,
      otherDoc1, otherDoc2, otherDoc3, otherDoc4, otherDoc5
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id,
    safe(docs.hrmsNo),
    safe(docs.requestId),
    safe(docs.dischargeCertificate),
    safe(docs.doctorPrescription),
    safe(docs.medicineBills),
    safe(docs.diagnosticReports),
    safe(docs.otherDoc1),
    safe(docs.otherDoc2),
    safe(docs.otherDoc3),
    safe(docs.otherDoc4),
    safe(docs.otherDoc5)
  ];

  try {
    await connection.execute(query, values);
    console.log("✅ Welfare documents inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting welfare documents:", error);
    throw error;
  }
};


// retrieve welfare documents by id
export const getWelfareDocsById = async (requestId) => {
  const query = `
    SELECT *
    FROM welfareDocs
    WHERE fundId = ?
  `;

  try {
    const [rows] = await pool.execute(query, [requestId]);
    if (!rows.length) return null;

    // remove null values
    const filtered = Object.fromEntries(
      Object.entries(rows[0]).filter(([_, value]) => value !== null)
    );

    return filtered;

  } catch (error) {
    console.error("❌ Error retrieving welfare documents:", error);
    throw error;
  }
};
