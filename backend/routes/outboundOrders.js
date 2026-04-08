const express = require("express");

const outboundOrdersController = require("../controllers/outboundOrders");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizeRoles } = require("../utils/authHandler");
const {
  validate,
  mongoIdParamRule,
  outboundOrderListRules,
  outboundOrderCreateRules,
  outboundOrderUpdateRules
} = require("../utils/validator");

const router = express.Router();

router.use(requireAuth, authorizeRoles("admin", "user"));

router.get(
  "/",
  outboundOrderListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await outboundOrdersController.listOutboundOrders(req.query);
    res.json(result);
  })
);

router.get(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await outboundOrdersController.getOutboundOrderById(req.params.id);
    res.json({
      message: "Outbound order fetched successfully",
      data
    });
  })
);

router.post(
  "/",
  outboundOrderCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await outboundOrdersController.createOutboundOrder(req.body, req.user);
    res.status(201).json({
      message: "Outbound order created successfully",
      data
    });
  })
);

router.post(
  "/:id/submit",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await outboundOrdersController.submitOutboundOrder(req.params.id, req.user);
    res.json({
      message: "Outbound order submitted successfully",
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
    const data = await outboundOrdersController.shipOutboundOrder(req.params.id, req.user);
    res.json({
      message: "Outbound order shipped successfully",
      data
    });
  })
);

router.post(
  "/:id/cancel",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await outboundOrdersController.cancelOutboundOrder(req.params.id, req.user);
    res.json({
      message: "Outbound order cancelled successfully",
      data
    });
  })
);

module.exports = router;
