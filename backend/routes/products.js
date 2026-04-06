const express = require("express");
const { requireAuth, authorizePermissions } = require("../utils/authHandler");
const { PERMISSION_CODES } = require("../utils/accessControlBootstrap");
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

// GET / - Public to support dashboard stats for anonymous users
router.get(
  "/",
  productListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await productsController.listProducts(req.query);
    res.json(result);
  })
);

// GET /:id - Public access
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
  requireAuth,
  authorizePermissions(PERMISSION_CODES.PRODUCT_CREATE),
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
  requireAuth,
  authorizePermissions(PERMISSION_CODES.PRODUCT_UPDATE),
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
  requireAuth,
  authorizePermissions(PERMISSION_CODES.PRODUCT_DELETE),
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
