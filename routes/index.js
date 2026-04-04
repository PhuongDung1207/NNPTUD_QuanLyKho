const express = require("express");

const productsRouter = require("./products");
const purchaseOrdersRouter = require("./purchaseOrders");
const brandsRouter = require("./brands");
const unitsRouter = require("./units");
const suppliersRouter = require("./suppliers");
const warehousesRouter = require("./warehouses");
const inventoriesRouter = require("./inventories");
const transferOrdersRouter = require("./transferOrders");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    message: "API v1 is healthy",
    timestamp: new Date().toISOString()
  });
});

router.use("/products", productsRouter);
router.use("/purchase-orders", purchaseOrdersRouter);
router.use("/brands", brandsRouter);
router.use("/units", unitsRouter);
router.use("/suppliers", suppliersRouter);
router.use("/warehouses", warehousesRouter);
router.use("/inventories", inventoriesRouter);
router.use("/transfer-orders", transferOrdersRouter);

module.exports = router;
