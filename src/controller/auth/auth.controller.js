import jwt from "jsonwebtoken";
import { loginUser, resetPassword } from "../../model/auth/auth.model.js";

export const loginController = async (req, res) => {
  try {
    const { hrmsNo, password, formType } = req.body;
    console.log('Form Type:', formType);
    const user = await loginUser(hrmsNo, password, formType);

    if (!user) {
      return res.status(401).json({ message: "Invalid HRMS or Password" });
    }

    if (formType === 'rkky' && user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Not an admin." });
    }

    const token = jwt.sign(
      { hrmsNo: user.hrmsNo, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ message: "Login successful", token, user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const resetPasswordController = async (req, res) => {
  const { hrmsNo, newMobileNo } = req.body;

  try {
    const changed = await resetPassword(hrmsNo, newMobileNo);

    if (!changed)
      return res.status(400).json({ message: "HRMS not found" });

    return res.json({ message: "Mobile number updated (password changed)" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
