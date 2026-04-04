const express = require("express");

const productsRouter = require("./products");
const purchaseOrdersRouter = require("./purchaseOrders");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    message: "API v1 is healthy",
    timestamp: new Date().toISOString()
  });
});

router.use("/products", productsRouter);
router.use("/purchase-orders", purchaseOrdersRouter);

module.exports = router;
