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

// Explicit CORS configuration
app.use(cors({
  origin: ["https://rayat-kutumb-kalyan-frontend.vercel.app", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Manual OPTIONS handler (insurance)
app.options("*", cors());

app.use(express.json());

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Database initialization with error handling
const initDB = async () => {
  try {
    await checkConnection();
    await createAllTables();
    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ Database initialization failed:", err.message);
  }
};

initDB();

app.get("/", (req, res) => {
  res.send("🚀 Welfare System API Running");
});

app.use("/employees", employeeRoutes);
app.use("/auth", authRoutes);
app.use('/user', userRoute);
app.use('/profile', userProfileRoutes);
app.use('/admin', adminRoutes);
app.use("/funds", fundsRoutes);
app.use("/api/applications", applicationsRoutes);

// Global Error Handler with CORS headers
app.use((err, req, res, next) => {
  console.error(`💥 Server Error: ${err.message}`);
  res.header("Access-Control-Allow-Origin", "https://rayat-kutumb-kalyan-frontend.vercel.app");
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || "Internal Server Error" 
  });
});

// Catch-all route for 404s
app.use((req, res) => {
  console.error(`❌ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
