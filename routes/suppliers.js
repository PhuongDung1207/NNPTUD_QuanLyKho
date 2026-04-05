const express = require("express");

const suppliersController = require("../controllers/suppliers");
const asyncHandler = require("../utils/asyncHandler");
const {
  validate,
  mongoIdParamRule,
  supplierListRules,
  supplierCreateRules,
  supplierUpdateRules
} = require("../utils/validator");

const router = express.Router();

router.get(
  "/",
  supplierListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await suppliersController.listSuppliers(req.query);
    res.json(result);
  })
);

router.get(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await suppliersController.getSupplierById(req.params.id);
    res.json({
      message: "Supplier fetched successfully",
      data
    });
  })
);

router.post(
  "/",
  supplierCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await suppliersController.createSupplier(req.body);
    res.status(201).json({
      message: "Supplier created successfully",
      data
    });
  })
);

router.patch(
  "/:id",
  mongoIdParamRule("id"),
  supplierUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await suppliersController.updateSupplierById(req.params.id, req.body);
    res.json({
      message: "Supplier updated successfully",
      data
    });
  })
);

router.delete(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await suppliersController.archiveSupplierById(req.params.id);
    res.json({
      message: "Supplier archived successfully",
      data
    });
  })
);

module.exports = router;
