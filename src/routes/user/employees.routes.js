import express from "express";
import {
  createEmployeeController,
  getAllEmployeesController,
  updateEmployeeController,
  deleteEmployeeController,
  getEmployeeProfile,
} from "../../controller/user/employees.controller.js";
import { getAdminStats } from "../../controller/user/stats.controller.js";

const router = express.Router();

router.get("/stats", getAdminStats);

router.post("/create", createEmployeeController);
router.get("/get-all-emp", getAllEmployeesController);
router.get("/get-emp-prf/:hrmsNo", getEmployeeProfile);
router.put("/upd-emp/:hrmsNo", updateEmployeeController);
router.delete("/del-emp/:hrmsNo", deleteEmployeeController);



export default router;
