// Backend server for Mathematico Mobile App
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const app = express();

// ----------------- Security -----------------
app.use(helmet({ contentSecurityPolicy: false }));

// ----------------- CORS -----------------
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// ----------------- Body Parsers -----------------
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ----------------- Static -----------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// ----------------- Favicon & Robots -----------------
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "favicon.ico"), err => {
    if (err) res.status(204).end(); // No Content if missing
  });
});

app.get("/robots.txt", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "robots.txt"), err => {
    if (err) res.status(204).end();
  });
});

// ----------------- Root & Health -----------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API is running ✅",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    vercel: !!process.env.VERCEL,
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API is healthy ✅",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    vercel: !!process.env.VERCEL,
  });
});

// ----------------- Import routes dynamically -----------------
try {
  const authController = require("./controllers/authController");
  const adminController = require("./controllers/adminController");
  const mobileController = require("./controllers/mobileController");
  const profileController = require("./controllers/profileController");
  const studentController = require("./controllers/studentController");
  const { authenticateToken } = require("./middlewares/auth");
  const { requireAdmin } = require("./middlewares/authMiddleware");
  const { uploadFilesForBook } = require("./controllers/adminController");

  // (Register routes exactly as before…)
  // Example:
  app.post("/api/v1/auth/login", authController.login);
  // 🔽 Continue all your routes like before…
} catch (err) {
  console.error("❌ Route setup failed:", err.message);
}

// ----------------- 404 & Error Handler -----------------
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error("🔥 Global error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ----------------- Export for Vercel -----------------
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

module.exports = app;
