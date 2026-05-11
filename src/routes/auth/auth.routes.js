import express from "express";
import { loginController, resetPasswordController } from "../../controller/auth/auth.controller.js";

const router = express.Router();

router.post("/login", loginController);
router.post("/reset-password", resetPasswordController);

export default router;
