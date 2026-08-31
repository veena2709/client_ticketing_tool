const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const adminRoutes = require("./routes/adminRoutes");

const { sendResponse } = require("./utils/response");

const app = express();

// ==============================
// Middlewares
// ==============================
app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);

app.use(morgan("combined"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// Static Upload Folder
// ==============================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==============================
// Rate Limiter
// ==============================
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: Number(process.env.RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply limiter only on login
app.use("/api/auth/login", limiter);

// ==============================
// Routes
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);

// ==============================
// Health Check
// ==============================
app.get("/health", (req, res) => {
  return sendResponse(res, 200, true, { status: "ok" }, "Service healthy");
});

// ==============================
// Error Handler
// ==============================
app.use((err, req, res, next) => {
  console.error("EXPRESS ERROR");
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return sendResponse(
    res,
    err.statusCode || 500,
    false,
    null,
    err.message || "Internal Server Error",
  );
});

module.exports = app;
