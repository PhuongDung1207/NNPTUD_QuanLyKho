const express = require("express");
const router = express.Router();
const categoriesController = require("../controllers/categories");
const asyncHandler = require("../utils/asyncHandler");

router.get("/", asyncHandler(async (req, res) => {
  const result = await categoriesController.listCategories(req.query);
  res.json(result);
}));

router.post("/", asyncHandler(async (req, res) => {
  const result = await categoriesController.createCategory(req.body);
  res.status(201).json({ message: "Category created successfully", data: result });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const result = await categoriesController.updateCategory(req.params.id, req.body);
  res.json({ message: "Category updated successfully", data: result });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const result = await categoriesController.deleteCategory(req.params.id);
  res.json(result);
}));

module.exports = router;
