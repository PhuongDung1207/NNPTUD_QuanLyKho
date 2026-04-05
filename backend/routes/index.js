const express = require("express");

const authRouter = require("./auth");
const usersRouter = require("./users");
const rolesRouter = require("./roles");
const permissionsRouter = require("./permissions");
const productsRouter = require("./products");
const purchaseOrdersRouter = require("./purchaseOrders");
const brandsRouter = require("./brands");
const unitsRouter = require("./units");
const suppliersRouter = require("./suppliers");
const batchLotsRouter = require("./batchLots");
const productVariantsRouter = require("./productVariants");
const messagesRouter = require("./messages");

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
router.use("/purchase-orders", purchaseOrdersRouter);
router.use("/brands", brandsRouter);
router.use("/units", unitsRouter);
router.use("/suppliers", suppliersRouter);
router.use("/batch-lots", batchLotsRouter);
router.use("/categories", require("./categories"));
router.use("/warehouses", require("./warehouses"));
router.use("/product-variants", productVariantsRouter);
router.use("/messages", messagesRouter);

module.exports = router;
