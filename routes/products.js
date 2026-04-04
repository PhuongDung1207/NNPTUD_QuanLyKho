const express = require("express");

const productsController = require("../controllers/products");
const asyncHandler = require("../utils/asyncHandler");
const {
  validate,
  mongoIdParamRule,
  productListRules,
  productCreateRules,
  productUpdateRules
} = require("../utils/validator");

const router = express.Router();

router.get(
  "/",
  productListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await productsController.listProducts(req.query);

    res.json(result);
  })
);

router.get(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await productsController.getProductById(req.params.id);

    res.json({
      message: "Product fetched successfully",
      data
    });
  })
);

router.post(
  "/",
  productCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await productsController.createProductWithInventory(req.body);

    res.status(201).json({
      message: "Product created successfully",
      data
    });
  })
);

router.patch(
  "/:id",
  mongoIdParamRule("id"),
  productUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await productsController.updateProductById(req.params.id, req.body);

    res.json({
      message: "Product updated successfully",
      data
    });
  })
);

router.delete(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    await productsController.archiveProductById(req.params.id);

    res.json({
      message: "Product archived successfully"
    });
  })
);

module.exports = router;
