const express = require("express");

const warehousesController = require("../controllers/warehouses");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizeRoles } = require("../utils/authHandler");
const {
  validate,
  mongoIdParamRule,
  inventoryListRules,
  warehouseListRules,
  warehouseCreateRules,
  warehouseUpdateRules
} = require("../utils/validator");

const router = express.Router();

router.use(requireAuth, authorizeRoles("admin"));

router.get(
  "/",
  warehouseListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await warehousesController.listWarehouses(req.query);
    res.json(result);
  })
);

router.get(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await warehousesController.getWarehouseById(req.params.id);
    res.json({
      message: "Warehouse fetched successfully",
      data
    });
  })
);

router.get(
  "/:id/inventories",
  mongoIdParamRule("id"),
  inventoryListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await warehousesController.getWarehouseInventories(req.params.id, req.query);
    res.json(result);
  })
);

router.post(
  "/",
  warehouseCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await warehousesController.createWarehouse(req.body);
    res.status(201).json({
      message: "Warehouse created successfully",
      data
    });
  })
);

router.patch(
  "/:id",
  mongoIdParamRule("id"),
  warehouseUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await warehousesController.updateWarehouseById(req.params.id, req.body);
    res.json({
      message: "Warehouse updated successfully",
      data
    });
  })
);

router.delete(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await warehousesController.archiveWarehouseById(req.params.id);
    res.json({
      message: "Warehouse archived successfully",
      data
    });
  })
);

module.exports = router;
