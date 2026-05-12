import { pool } from "../../config/db.config.js";

// Create userProfile table
export const createUserProfileTable = async () => {
  const query = `
  CREATE TABLE IF NOT EXISTS user_profile (
  id varchar(255) PRIMARY KEY,
  profileType varchar(255) NULL,
  hrmsNo varchar(255) NOT NULL UNIQUE,
  employeeName varchar(255) NULL,
  gender varchar(255) NULL,
  maritalStatus varchar(255) NULL,
  panNo varchar(255) NULL,
  emailId varchar(255),
  mobileNo varchar(255),
  presentAddress varchar(255) NULL,
  permanentAddress varchar(255) NULL,
  branchName varchar(255),
  branchRegionName varchar(255),
  branchType varchar(255) NULL,
  branchJoiningDate date,
  designation varchar(255) NULL,
  currentAppointmentDate date NULL,
  currentAppointmentType varchar(255) NULL,
  firstAppointmentDate date NULL,
  firstJoiningDate date NULL,
  firstAppointmentType varchar(255) NULL,
  employeeType varchar(255) NULL,
  approvalRefNo varchar(255) NULL,
  approvalLetterDate date NULL,
  retirementDate date NULL,
  AppointmentNature varchar(255) NULL,
  qualifications varchar(255) NULL,
  schemeType varchar(50) DEFAULT 'New Scheme',
  role varchar(255) DEFAULT 'user'
  );`;
  await pool.query(query);

  // Migration for existing tables
  await ensureColumnExists("user_profile", "id", "varchar(255) FIRST");
  await ensureColumnExists("user_profile", "role", "varchar(255) DEFAULT 'user'");

  console.log("User Profile table created/ensured successfully");
};

async function ensureColumnExists(tableName, columnName, definition) {
  const [rows] = await pool.query(`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
  `, [tableName, columnName]);

  if (rows.length === 0) {
    console.log(`Adding missing column ${columnName} to ${tableName}`);
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}


export const ensureUserProfileHrmsIndex = async () => {
  return true;
};



// Insert user profile data into user_profile table
export const insertUserProfile = async (userProfile) => {
  const query = `
    INSERT INTO user_profile (
      profileType, hrmsNo, employeeName, gender, maritalStatus, panNo, emailId, mobileNo,
      presentAddress, permanentAddress, branchName, branchRegionName, branchType,
      branchJoiningDate, designation, currentAppointmentDate, currentAppointmentType,
      firstAppointmentDate, firstJoiningDate, firstAppointmentType, employeeType,
      retirementDate, AppointmentNature,qualifications, approvalRefNo, approvalLetterDate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    userProfile.profileType,
    userProfile.hrmsNo,
    userProfile.employeeName,
    userProfile.gender,
    userProfile.maritalStatus,
    userProfile.panNo,
    userProfile.emailId,
    userProfile.mobileNo,
    userProfile.presentAddress,
    userProfile.permanentAddress,
    userProfile.branchName,
    userProfile.branchRegionName,
    userProfile.branchType,
    userProfile.branchJoiningDate,
    userProfile.designation,
    userProfile.currentAppointmentDate,
    userProfile.currentAppointmentType,
    userProfile.firstAppointmentDate,
    userProfile.firstJoiningDate,
    userProfile.firstAppointmentType,
    userProfile.employeeType,
    userProfile.retirementDate,
    userProfile.AppointmentNature,
    userProfilequalifications,
    userProfile.approvalRefNo,
    userProfile.approvalLetterDate,
  ];

  try {
    const [result] = await pool.query(query, values);
    return result;
  } catch (error) {
    console.error("Error inserting user profile:", error.message);
    throw new Error("Failed to insert user profile");
  }
};

// Get user profile by user ID
export const getUserById = async (hrmsNo) => {
  const [rows] = await pool.query("SELECT * FROM user_profile WHERE hrmsNo = ?", [hrmsNo]);
  return rows; // Do NOT throw an error here
};

// Add this helper function at the top of the file
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString().slice(0, 10); // Returns YYYY-MM-DD format
};

export const updateUserProfile = async (hrmsNo, profileData) => {
  try {
    // Validate userId
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Format and validate the data
    const formattedData = {
      profileType: profileData.profileType || null,
      hrmsNo: profileData.hrmsNo || null,
      employeeName: profileData.employeeName || null,
      gender: profileData.gender || null,
      maritalStatus: profileData.maritalStatus || null,
      panNo: profileData.panNo || null,
      emailId: profileData.emailId || null,
      mobileNo: profileData.mobileNo || null,
      presentAddress: profileData.presentAddress || null,
      permanentAddress: profileData.permanentAddress || null,
      branchName: profileData.branchName || null,
      branchRegionName: profileData.branchRegionName || null,
      branchType: profileData.branchType || null,
      branchJoiningDate: profileData.branchJoiningDate ?
        formatDate(profileData.branchJoiningDate) : null,
      designation: profileData.designation || null,
      currentAppointmentDate: profileData.currentAppointmentDate ?
        formatDate(profileData.currentAppointmentDate) : null,
      currentAppointmentType: profileData.currentAppointmentType || null,
      firstAppointmentDate: profileData.firstAppointmentDate ?
        formatDate(profileData.firstAppointmentDate) : null,
      firstJoiningDate: profileData.firstJoiningDate ?
        formatDate(profileData.firstJoiningDate) : null,
      firstAppointmentType: profileData.firstAppointmentType || null,
      employeeType: profileData.employeeType || null,
      retirementDate: profileData.retirementDate ?
        formatDate(profileData.retirementDate) : null,
      AppointmentNature: profileData.AppointmentNature || null,
      qualifications: profileDataqualifications || null,
      approvalRefNo: profileData.approvalRefNo || null,
      approvalLetterDate: profileData.approvalLetterDate ?
        formatDate(profileData.approvalLetterDate) : null
    };

    // Build dynamic query based on available data
    const updates = [];
    const values = [];

    Object.entries(formattedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    // Add userId at the end for WHERE clause
    values.push(hrmsNo);

    const query = `
            UPDATE user_profile
            SET ${updates.join(', ')}
            WHERE hrmsNo = ?
        `;

    const [result] = await pool.execute(query, values);

    if (result.affectedRows === 0) {
      throw new Error('User profile not found');
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      updatedFields: Object.keys(formattedData).filter(key => formattedData[key] !== undefined)
    };

  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw new Error('Failed to update user profile');
  }
};

// get all user profiles
export const getAllUserProfiles = async () => {
  const query = `
    SELECT * FROM user_profile
  `;
  const [result] = await pool.query(query);
  return result;
}

// delete user profile by id
export const deleteUserProfile = async (id) => {
  const query = `
    DELETE FROM user_profile
    WHERE id = ?
  `;
  try {
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows === 0) {
      throw new Error("User profile not found");
    }
    return result;
  } catch (error) {
    console.error("Error deleting user profile:", error.message);
    throw new Error("Failed to delete user profile");
  }
}

// get user profile by HRMS number
export const getUserByHRMSNo = async (hrmsNo) => {
  const query = `
    SELECT * FROM user_profile
    WHERE hrmsNo = ?
  `;
  const [result] = await pool.query(query, [hrmsNo]);
  if (result.length === 0) {
    throw new Error("User profile not found");
  }
  return result;
}

// get users by branch name
export const getUsersByBranchName = async (branchName) => {
  const query = `
    SELECT * FROM user_profile
    WHERE branchName = ?
  `;
  const [result] = await pool.query(query, [branchName]);
  if (result.length === 0) {
    throw new Error("No users found for this branch name");
  }
  return result;
}

// get users by branch region name
export const getUsersByBranchRegionName = async (branchRegionName) => {
  const query = `
    SELECT * FROM user_profile
    WHERE branchRegionName = ?
  `;
  const [result] = await pool.query(query, [branchRegionName]);
  if (result.length === 0) {
    throw new Error("No users found for this branch region name");
  }
  return result;
}
