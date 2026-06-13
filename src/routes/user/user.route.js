import express from "express";
import { submitWelfareForm, resubmitWelfareForm } from "../../controller/user/welfareForm.controller.js"; 
const router = express.Router();

router.post("/submit-welfare-form", submitWelfareForm);
router.put("/resubmit-welfare-form/:requestId", resubmitWelfareForm);

export default router;