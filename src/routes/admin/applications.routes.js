import express from "express";
import {
  getApplicationsByStatusController,
  getReportApplicationsController,
  patchApprovedAmountController,
} from "../../controller/user/welfareForm.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyToken, getApplicationsByStatusController);
router.get("/reports", verifyToken, getReportApplicationsController);
router.patch("/:id/approve-amount", verifyToken, patchApprovedAmountController);

export default router;
