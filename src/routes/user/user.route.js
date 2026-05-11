import express from "express";
import { submitWelfareForm } from "../../controller/user/welfareForm.controller.js"; 
const router = express.Router();

router.post("/submit-welfare-form", submitWelfareForm);

export default router;