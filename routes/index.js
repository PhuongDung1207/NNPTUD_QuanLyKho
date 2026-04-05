const express = require("express");

const productsRouter = require("./products");
const purchaseOrdersRouter = require("./purchaseOrders");
<<<<<<< HEAD
const brandsRouter = require("./brands");
const unitsRouter = require("./units");
const suppliersRouter = require("./suppliers");
=======
const batchLotsRouter = require("./batchLots");
>>>>>>> 0aaacad (final)

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    message: "API v1 is healthy",
    timestamp: new Date().toISOString()
  });
});

router.use("/products", productsRouter);
router.use("/purchase-orders", purchaseOrdersRouter);
<<<<<<< HEAD
router.use("/brands", brandsRouter);
router.use("/units", unitsRouter);
router.use("/suppliers", suppliersRouter);
=======
router.use("/batch-lots", batchLotsRouter);
>>>>>>> 0aaacad (final)

module.exports = router;
