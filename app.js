require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

const createError = require("http-errors");

const apiRouter = require("./routes");
const { seedAccessControl } = require("./utils/accessControlBootstrap");

const app = express();
const publicDirectory = path.join(__dirname, "public");

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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(publicDirectory));

app.get(["/", "/login"], (req, res) => {
  res.sendFile(path.join(publicDirectory, "login.html"));
});

app.get("/activate-account", (req, res) => {
  res.sendFile(path.join(publicDirectory, "activate-account.html"));
});

app.get("/users", (req, res) => {
  res.sendFile(path.join(publicDirectory, "users.html"));
});

app.get("/products", (req, res) => {
  res.sendFile(path.join(publicDirectory, "products.html"));
});

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

  const status = error.status || 500;

  res.status(status).json({
    message: error.message || "Internal server error",
    errors: error.errors || undefined,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined
  });
});

module.exports = app;
