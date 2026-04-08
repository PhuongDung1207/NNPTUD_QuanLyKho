const path = require("path");
const express = require("express");
const { requireAuth, authorizeRoles } = require("../utils/authHandler");
const productsController = require("../controllers/products");
const asyncHandler = require("../utils/asyncHandler");
const { createDiskUpload, IMAGE_MIME_TYPES } = require("../utils/uploadHandler");
const {
  validate,
  mongoIdParamRule,
  productListRules,
  productCreateRules,
  productUpdateRules
} = require("../utils/validator");

const router = express.Router();
const productImageUpload = createDiskUpload({
  destination: path.join(__dirname, "..", "public", "uploads", "products"),
  allowedMimeTypes: IMAGE_MIME_TYPES
});

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
  "/upload-images",
  productImageUpload.array("images", 5),
  asyncHandler(async (req, res) => {
    const data = await productsController.uploadProductImages(req.files, {
      origin: `${req.protocol}://${req.get("host")}`
    });

    res.status(201).json({
      message: "Product images uploaded successfully",
      data
    });
  })
);

router.post(
  "/",
  requireAuth,
  authorizeRoles("admin"),
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
  authorizeRoles("admin"),
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
  authorizeRoles("admin"),
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
