const express = require("express");

const transferOrdersController = require("../controllers/transferOrders");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizeRoles } = require("../utils/authHandler");
const {
  validate,
  mongoIdParamRule,
  transferOrderListRules,
  transferOrderCreateRules,
  transferOrderUpdateRules
} = require("../utils/validator");

const router = express.Router();

router.use(requireAuth, authorizeRoles("admin", "user"));

router.get(
  "/",
  transferOrderListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await transferOrdersController.listTransferOrders(req.query);
    res.json(result);
  })
);

router.get(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await transferOrdersController.getTransferOrderById(req.params.id);
    res.json({
      message: "Transfer order fetched successfully",
      data
    });
  })
);

router.post(
  "/",
  transferOrderCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await transferOrdersController.createTransferOrder(req.body, req.user);
    res.status(201).json({
      message: "Transfer order created successfully",
      data
    });
  })
);

router.patch(
  "/:id",
  mongoIdParamRule("id"),
  transferOrderUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await transferOrdersController.updateTransferOrderById(req.params.id, req.body, req.user);
    res.json({
      message: "Transfer order updated successfully",
      data
    });
  })
);

router.post(
  "/:id/submit",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await transferOrdersController.submitTransferOrder(req.params.id, req.user);
    res.json({
      message: "Transfer order submitted successfully",
      data
    });
  })
);

router.post(
  "/:id/ship",
  authorizeRoles("admin"),
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await transferOrdersController.shipTransferOrder(req.params.id, req.user);
    res.json({
      message: "Transfer order shipped successfully",
      data
    });
  })
);

router.post(
  "/:id/receive",
  authorizeRoles("admin"),
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await transferOrdersController.receiveTransferOrder(req.params.id, req.user);
    res.json({
      message: "Transfer order received successfully",
      data
    });
  })
);

router.post(
  "/:id/cancel",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await transferOrdersController.cancelTransferOrder(req.params.id, req.user);
    res.json({
      message: "Transfer order cancelled successfully",
      data
    });
  })
);

module.exports = router;
