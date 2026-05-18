import express from "express";
import { getForms, getFormsOfUser, getUsersController, updateFormApprovalAmt, updateFormStatus, getApprovedUnpaidForms, getFormDetail, deleteFormController } from "../../controller/user/welfareForm.controller.js";
import { getWelfareDocs } from "../../controller/user/welfareDocs.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { getAdminDashboardData } from "../../controller/admin/adminDashboard.controller.js";
import { approveFundDisbursement, getFundDisbursementUsers, getUsersByFundStatus, getDisbursementHistory } from "../../controller/admin/adminFunds.controller.js";

const route = express.Router();

route.get("/dashboard", verifyToken, getAdminDashboardData);
route.patch('/update-form-status', updateFormStatus);
route.patch('/update-appr-amt', updateFormApprovalAmt);
route.get('/get-all-forms', getForms);
route.get('/get-user-forms', getFormsOfUser);
route.get('/get-users', getUsersController);
route.get('/get-docs', getWelfareDocs)
route.get("/funds-users", verifyToken, getUsersByFundStatus);
route.get("/fund-disbursement-users", verifyToken, getFundDisbursementUsers);
route.post("/approve-fund-disbursement", verifyToken, approveFundDisbursement);
route.get("/disbursement-history", verifyToken, getDisbursementHistory);
route.get('/approved-unpaid-forms', getApprovedUnpaidForms);
route.get('/get-form-detail', getFormDetail);
route.delete('/delete-form/:requestId', deleteFormController);

export default route;
