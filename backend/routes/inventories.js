const express = require("express");

const inventoriesController = require("../controllers/inventories");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizeRoles } = require("../utils/authHandler");
const {
  validate,
  mongoIdParamRule,
  inventoryListRules,
  inventoryCreateRules,
  inventoryUpdateRules
} = require("../utils/validator");

const router = express.Router();

router.use(requireAuth, authorizeRoles("admin"));

router.get(
  "/",
  inventoryListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await inventoriesController.listInventories(req.query);
    res.json(result);
  })
);

router.get(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await inventoriesController.getInventoryById(req.params.id);
    res.json({
      message: "Inventory fetched successfully",
      data
    });
  })
);

router.post(
  "/",
  inventoryCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await inventoriesController.createInventory(req.body, req.user);
    res.status(201).json({
      message: "Inventory created successfully",
      data
    });
  })
);

router.patch(
  "/:id",
  mongoIdParamRule("id"),
  inventoryUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await inventoriesController.updateInventoryById(req.params.id, req.body, req.user);
    res.json({
      message: "Inventory updated successfully",
      data
    });
  })
);

module.exports = router;
