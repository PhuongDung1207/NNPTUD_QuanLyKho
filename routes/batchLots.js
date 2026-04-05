const express = require("express");

const batchLotsController = require("../controllers/batchLots");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizeRoles } = require("../utils/authHandler");
const {
  validate,
  mongoIdParamRule,
  batchLotListRules,
  batchLotCreateRules,
  batchLotUpdateRules,
  batchLotStatusRules
} = require("../utils/validator");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  batchLotListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await batchLotsController.listBatchLots(req.query);

    res.json(result);
  })
);

router.get(
  "/:id",
  requireAuth,
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await batchLotsController.getBatchLotById(req.params.id);

    res.json({
      message: "Batch lot fetched successfully",
      data
    });
  })
);

router.post(
  "/",
  requireAuth,
  authorizeRoles("admin"),
  batchLotCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await batchLotsController.createBatchLot(req.body, req.user);

    res.status(201).json({
      message: "Batch lot created successfully",
      data
    });
  })
);

router.patch(
  "/:id",
  requireAuth,
  authorizeRoles("admin"),
  mongoIdParamRule("id"),
  batchLotUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await batchLotsController.updateBatchLotById(req.params.id, req.body);

    res.json({
      message: "Batch lot updated successfully",
      data
    });
  })
);

router.patch(
  "/:id/status",
  requireAuth,
  authorizeRoles("admin"),
  mongoIdParamRule("id"),
  batchLotStatusRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await batchLotsController.updateBatchLotStatus(req.params.id, req.body);

    res.json({
      message: "Batch lot status updated successfully",
      data
    });
  })
);

module.exports = router;
