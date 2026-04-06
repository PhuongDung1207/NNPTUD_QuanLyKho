require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const multer = require("multer");

const createError = require("http-errors");

const cors = require("cors");
const apiRouter = require("./routes");
const { seedAccessControl } = require("./utils/accessControlBootstrap");

const app = express();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse');
mongoose.connection.on('connected', function () {
  console.log("connected");
  seedAccessControl().catch((error) => {
    console.error("failed to seed access control", error);
  });
})
mongoose.connection.on('disconnected', function () {
  console.log("disconnected");
})
mongoose.connection.on('disconnecting', function () {
  console.log("disconnecting");
})

app.use(logger("dev"));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3001",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get("/healthz", (req, res) => {
  res.json({
    message: "Warehouse API is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/v1", apiRouter);

app.use((req, res, next) => {
  next(createError(404, "Route not found"));
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  // Handle Mongoose Validation Errors
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Lỗi kiểm tra dữ liệu",
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  // Handle Mongoose Duplication Errors (e.g., unique code)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field === 'code' ? 'Mã hiệu' : field} đã tồn tại trong hệ thống`,
    });
  }

  const status = error.status || (error instanceof multer.MulterError ? 400 : 500);
  const message =
    error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "File size exceeds the 5MB limit"
      : error.message || "Internal server error";

  res.status(status).json({
    success: false,
    message,
    errors: error.errors || undefined,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined
  });
});

module.exports = app;
