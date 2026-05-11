import pool from "../../config/db.config.js";
import {
  insertEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee
} from "../../model/user/userProfileEmployees.model.js";

import { v4 as uuidv4 } from "uuid";
import { sendWelcomeEmail } from "../../utils/mailer.js";

// Create new employee
export const createEmployeeController = async (req, res) => {
  try {
    const data = { id: uuidv4(), ...req.body };
    const result = await insertEmployee(data);

    if (data.emailId) {
      // Send welcome email with username (hrmsNo) and password (mobileNo)
      await sendWelcomeEmail(data.emailId, data.hrmsNo, data.mobileNo);
    }

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      id: data.id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all employees
export const getAllEmployeesController = async (req, res) => {
  try {
    const rows = await getAllEmployees();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get employee by HRMS
export const getEmployeeProfile = async (req, res) => {
  try {
    const { hrmsNo } = req.params;
    const [rows] = await pool.execute(
      "SELECT * FROM user_profile WHERE hrmsNo = ?",
      [hrmsNo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.status(200).json(rows[0]);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


// Update employee
export const updateEmployeeController = async (req, res) => {
  try {
    await updateEmployee(req.params.hrmsNo, req.body);
    res.json({ success: true, message: "Employee updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete
export const deleteEmployeeController = async (req, res) => {
  try {
    await deleteEmployee(req.params.hrmsNo);
    res.json({ success: true, message: "Employee deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
