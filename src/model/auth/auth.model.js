import { runQuery } from "../../config/db.config.js";

// LOGIN — hrmsNo + mobileNo
export const loginUser = async (hrmsNo, mobileNo, formType) => {

  console.log('login user called with:', hrmsNo, mobileNo);
  let query = "";

  if (formType === 'rkky') {
    query = `
      SELECT * FROM user_profile 
      WHERE hrmsNo = ? AND mobileNo = ? AND role = 'admin'
    `;
  } else {
    query = `
      SELECT * FROM user_profile
      WHERE hrmsNo = ? AND mobileNo = ?
    `;
  }

  console.log('Executing query: ', query, [hrmsNo, mobileNo]);

  const rows = await runQuery(query, [hrmsNo, mobileNo]);
  console.log(rows);
  return rows[0] || null;
};

// RESET PASSWORD — update mobileNo
export const resetPassword = async (hrmsNo, newMobileNo) => {
  const query = `
    UPDATE user_profile SET mobileNo = ? WHERE hrmsNo = ?
  `;
  const result = await runQuery(query, [newMobileNo, hrmsNo]);
  return result.affectedRows > 0;
};
