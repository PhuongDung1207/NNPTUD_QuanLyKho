const express = require("express");
const router = express.Router();
const warehousesController = require("../controllers/warehouses");
const asyncHandler = require("../utils/asyncHandler");

router.get("/", asyncHandler(async (req, res) => {
  const result = await warehousesController.listWarehouses();
  res.json(result);
}));

module.exports = router;
