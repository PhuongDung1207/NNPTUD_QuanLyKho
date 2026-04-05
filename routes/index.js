const express = require("express");

const authRouter = require("./auth");
const usersRouter = require("./users");
const rolesRouter = require("./roles");
const permissionsRouter = require("./permissions");
const productsRouter = require("./products");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    message: "API v1 is healthy",
    timestamp: new Date().toISOString()
  });
});

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/roles", rolesRouter);
router.use("/permissions", permissionsRouter);
router.use("/products", productsRouter);

module.exports = router;
