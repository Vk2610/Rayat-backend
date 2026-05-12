import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { checkConnection } from "./src/config/db.config.js";
import { createAllTables } from "./src/model/user/welfareForm.model.js";
import employeeRoutes from "./src/routes/user/employees.routes.js";
import authRoutes from "./src/routes/auth/auth.routes.js";
import userRoute from "./src/routes/user/user.route.js";
import userProfileRoutes from "./src/routes/user/userProfile.routes.js";
import adminRoutes from "./src/routes/admin/admin.routes.js";
import fundsRoutes from "./src/routes/user/funds.routes.js";
import applicationsRoutes from "./src/routes/admin/applications.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

await checkConnection();
await createAllTables();

app.use("/employees", employeeRoutes);
app.use("/auth", authRoutes);
app.use('/user', userRoute);
app.use('/profile', userProfileRoutes);
app.use('/admin', adminRoutes);
app.use("/funds", fundsRoutes);
app.use("/api/applications", applicationsRoutes);


app.get("/", (req, res) => {
  res.send("🚀 Welfare System API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
