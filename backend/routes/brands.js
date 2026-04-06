const express = require("express");

const brandsController = require("../controllers/brands");
const asyncHandler = require("../utils/asyncHandler");
const {
  validate,
  mongoIdParamRule,
  brandListRules,
  brandCreateRules,
  brandUpdateRules
} = require("../utils/validator");

const router = express.Router();

router.get(
  "/",
  brandListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await brandsController.listBrands(req.query);
    res.json(result);
  })
);

router.get(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await brandsController.getBrandById(req.params.id);
    res.json({
      message: "Brand fetched successfully",
      data
    });
  })
);

router.post(
  "/",
  brandCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await brandsController.createBrand(req.body);
    res.status(201).json({
      message: "Brand created successfully",
      data
    });
  })
);

router.patch(
  "/:id",
  mongoIdParamRule("id"),
  brandUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await brandsController.updateBrandById(req.params.id, req.body);
    res.json({
      message: "Brand updated successfully",
      data
    });
  })
);

router.delete(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await brandsController.archiveBrandById(req.params.id);
    res.json({
      message: "Brand archived successfully",
      data
    });
  })
);

module.exports = router;
