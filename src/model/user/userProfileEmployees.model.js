import { pool } from "../../config/db.config.js";
import { v4 as uuidv4 } from "uuid";
import { createUserProfileTable } from "./userProfile.model.js";

export default async function ensureUserProfileEmployeeStore() {
  await createUserProfileTable();
  console.log("user_profile schema ensured for employee APIs");
}

export const insertEmployee = async (employeeData) => {
  const id = uuidv4();

  const query = `
    INSERT INTO user_profile (
      id, hrmsNo, employeeName, profileType, gender, maritalStatus, panNo, emailId,
      currentAppointmentDate, currentAppointmentType,
      firstAppointmentDate, firstJoiningDate, firstAppointmentType,
      employeeType, approvalRefNo, approvalLetterDate, retirementDate,
      appointmentNature, qualifications, mobileNo, presentAddress,
      permanentAddress, branchName, branchRegionName, branchType,
      branchJoiningDate, designation, role, Nominee1, Relation1, Nominee2, Relation2,
      schemeType
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const values = [
    id,
    employeeData.hrmsNo,
    employeeData.employeeName,
    employeeData.profileType,
    employeeData.gender,
    employeeData.maritalStatus,
    employeeData.panNo,
    employeeData.emailId,
    formatDate(employeeData.currentAppointmentDate),
    employeeData.currentAppointmentType,
    formatDate(employeeData.firstAppointmentDate),
    formatDate(employeeData.firstJoiningDate),
    employeeData.firstAppointmentType,
    employeeData.employeeType,
    employeeData.approvalRefNo,
    formatDate(employeeData.approvalLetterDate),
    formatDate(employeeData.retirementDate),
    employeeData.appointmentNature,
    employeeData.qualifications,
    employeeData.mobileNo,
    employeeData.presentAddress,
    employeeData.permanentAddress,
    employeeData.branchName,
    employeeData.branchRegionName,
    employeeData.branchType,
    formatDate(employeeData.branchJoiningDate),
    employeeData.designation,
    employeeData.role || "user",
    employeeData.Nominee1 || "",
    employeeData.Relation1 || "",
    employeeData.Nominee2 || "",
    employeeData.Relation2 || "",
    employeeData.schemeType || "New Scheme",
  ];

  const [result] = await pool.execute(query, values);
  return { id, affected: result.affectedRows };
};

export const getAllEmployees = async () => {
  const [rows] = await pool.execute(`
    SELECT
      u.*,
      COALESCE(
        NULLIF(CAST(u.firstJoiningDate AS CHAR), '0000-00-00'),
        NULLIF(CAST(u.branchJoiningDate AS CHAR), '0000-00-00'),
        NULLIF(CAST(u.currentAppointmentDate AS CHAR), '0000-00-00'),
        NULLIF(CAST(u.firstAppointmentDate AS CHAR), '0000-00-00')
      ) AS joiningDate,
      NULLIF(CAST(u.retirementDate AS CHAR), '0000-00-00') AS retirementDate,
      f.installment1,
      f.installment2,
      f.installment3,
      f.installment4,
      f.installment5,
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
          WHEN COALESCE(u.schemeType, 'Old Scheme') = 'New Scheme' THEN 5000
          ELSE 1200
        END THEN TRUE
        ELSE FALSE
      END AS claimedFullAmount
    FROM user_profile u
    LEFT JOIN funds f ON u.hrmsNo = f.hrmsNo
  `);

  return rows || [];
};

export const getEmployeeByHRMSNo = async (hrmsNo) => {
  const [rows] = await pool.execute(
    `SELECT * FROM user_profile WHERE hrmsNo = ?`,
    [hrmsNo],
  );
  return rows[0] || null;
};

export const updateEmployee = async (hrmsNo, updates) => {
  const columns = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      columns.push(`${key} = ?`);
      values.push(value);
    }
  }

  values.push(hrmsNo);

  const query = `UPDATE user_profile SET ${columns.join(", ")} WHERE hrmsNo = ?`;
  const [result] = await pool.execute(query, values);
  return result;
};

export const deleteEmployee = async (hrmsNo) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [employeeResult] = await connection.execute(
      `DELETE FROM user_profile WHERE hrmsNo = ?`,
      [hrmsNo],
    );

    const [wfUserResult] = await connection.execute(
      `DELETE FROM wf_users WHERE hrmsNo = ?`,
      [hrmsNo],
    );

    await connection.commit();
    return { employeeResult, wfUserResult };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 10);
};
