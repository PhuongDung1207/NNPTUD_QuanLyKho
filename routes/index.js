const express = require("express");

const productsRouter = require("./products");
const brandsRouter = require("./brands");
const unitsRouter = require("./units");
const suppliersRouter = require("./suppliers");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    message: "API v1 is healthy",
    timestamp: new Date().toISOString()
  });
});

router.use("/products", productsRouter);
router.use("/brands", brandsRouter);
router.use("/units", unitsRouter);
router.use("/suppliers", suppliersRouter);

module.exports = router;
