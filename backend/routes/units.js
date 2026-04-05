const express = require("express");

const unitsController = require("../controllers/units");
const asyncHandler = require("../utils/asyncHandler");
const {
  validate,
  mongoIdParamRule,
  unitListRules,
  unitCreateRules,
  unitUpdateRules
} = require("../utils/validator");

const router = express.Router();

router.get(
  "/",
  unitListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await unitsController.listUnits(req.query);
    res.json(result);
  })
);

router.get(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await unitsController.getUnitById(req.params.id);
    res.json({
      message: "Unit fetched successfully",
      data
    });
  })
);

router.post(
  "/",
  unitCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await unitsController.createUnit(req.body);
    res.status(201).json({
      message: "Unit created successfully",
      data
    });
  })
);

router.patch(
  "/:id",
  mongoIdParamRule("id"),
  unitUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await unitsController.updateUnitById(req.params.id, req.body);
    res.json({
      message: "Unit updated successfully",
      data
    });
  })
);

router.delete(
  "/:id",
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await unitsController.archiveUnitById(req.params.id);
    res.json({
      message: "Unit archived successfully",
      data
    });
  })
);

module.exports = router;
