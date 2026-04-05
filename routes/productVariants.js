const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const productVariantsController = require("../controllers/productVariants");

// List variants for a product
router.get(
  "/product/:productId",
  asyncHandler(async (req, res) => {
    const list = await productVariantsController.listVariantsByProduct(req.params.productId);
    res.json({ message: "Variants fetched successfully", data: list });
  })
);

// Create a variant
router.post(
  "/:productId",
  asyncHandler(async (req, res) => {
    const variant = await productVariantsController.createVariant(req.params.productId, req.body);
    res.status(201).json({ message: "Variant created successfully", data: variant });
  })
);

// Update a variant
router.patch(
  "/:variantId",
  asyncHandler(async (req, res) => {
    const variant = await productVariantsController.updateVariant(req.params.variantId, req.body);
    res.json({ message: "Variant updated successfully", data: variant });
  })
);

// Deactivate a variant
router.delete(
  "/:variantId",
  asyncHandler(async (req, res) => {
    const result = await productVariantsController.deleteVariant(req.params.variantId);
    res.json(result);
  })
);

module.exports = router;
