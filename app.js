const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const multer = require("multer");

const createError = require("http-errors");

const apiRouter = require("./routes");

const app = express();

mongoose.connect('mongodb://localhost:27017/warehouse');
mongoose.connection.on('connected', function () {
  console.log("connected");
})
mongoose.connection.on('disconnected', function () {
  console.log("disconnected");
})
mongoose.connection.on('disconnecting', function () {
  console.log("disconnecting");
})

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

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

  const status = error.status || (error instanceof multer.MulterError ? 400 : 500);
  const message =
    error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "File size exceeds the 5MB limit"
      : error.message || "Internal server error";

  res.status(status).json({
    message,
    errors: error.errors || undefined,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined
  });
});

module.exports = app;
