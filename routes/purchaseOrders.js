const express = require("express");

const purchaseOrdersController = require("../controllers/purchaseOrders");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizeRoles } = require("../utils/authHandler");
const {
  validate,
  mongoIdParamRule,
  purchaseOrderListRules,
  purchaseOrderCreateRules,
  purchaseOrderUpdateRules,
  purchaseOrderPartialReceiveRules,
  purchaseOrderReceiveRules,
  batchLotReceiveItemRules
} = require("../utils/validator");

const router = express.Router();

router.use(requireAuth, authorizeRoles("admin"));

router.get(
  "/",
  purchaseOrderListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await purchaseOrdersController.listPurchaseOrders(req.query);

    res.json(result);
  })
);

router.get(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await purchaseOrdersController.getPurchaseOrderById(req.params.id);

    res.json({
      message: "Purchase order fetched successfully",
      data
    });
  })
);

router.post(
  "/",
  purchaseOrderCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await purchaseOrdersController.createPurchaseOrder(req.body, req.user);

    res.status(201).json({
      message: "Purchase order created successfully",
      data
    });
  })
);

router.patch(
  "/:id",
  mongoIdParamRule("id"),
  purchaseOrderUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await purchaseOrdersController.updatePurchaseOrderById(req.params.id, req.body, req.user);

    res.json({
      message: "Purchase order updated successfully",
      data
    });
  })
);

router.post(
  "/:id/submit",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await purchaseOrdersController.submitPurchaseOrder(req.params.id);

    res.json({
      message: "Purchase order submitted successfully",
      data
    });
  })
);

router.post(
  "/:id/approve",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await purchaseOrdersController.approvePurchaseOrder(req.params.id);

    res.json({
      message: "Purchase order approved successfully",
      data
    });
  })
);

router.post(
  "/:id/receive-partial",
  mongoIdParamRule("id"),
  purchaseOrderPartialReceiveRules,
  batchLotReceiveItemRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await purchaseOrdersController.receivePurchaseOrderPartially(req.params.id, req.body, req.user);

    res.json({
      message: "Purchase order partially received successfully",
      data
    });
  })
);

router.post(
  "/:id/receive",
  mongoIdParamRule("id"),
  purchaseOrderReceiveRules,
  batchLotReceiveItemRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await purchaseOrdersController.receivePurchaseOrder(req.params.id, req.body, req.user);

    res.json({
      message: "Purchase order received successfully",
      data
    });
  })
);

router.post(
  "/:id/cancel",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await purchaseOrdersController.cancelPurchaseOrder(req.params.id);

    res.json({
      message: "Purchase order cancelled successfully",
      data
    });
  })
);

module.exports = router;
