const createError = require("http-errors");
const { Category } = require("../schemas");

async function listCategories(query = {}) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 50);
  const skip = (page - 1) * limit;

  const mongoQuery = { status: "active" };
  if (query.parent) {
    mongoQuery.parent = query.parent === "null" ? null : query.parent;
  }

  const [categories, total] = await Promise.all([
    Category.find(mongoQuery)
      .populate("parent", "name code")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    Category.countDocuments(mongoQuery)
  ]);

  return {
    data: categories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function createCategory(payload) {
  try {
    const category = await Category.create(payload);
    return category;
  } catch (error) {
    if (error.code === 11000) {
      throw createError(409, "Category code or slug already exists");
    }
    throw error;
  }
}

async function updateCategory(id, payload) {
  const category = await Category.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });
  if (!category) {
    throw createError(404, "Category not found");
  }
  return category;
}

async function deleteCategory(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw createError(404, "Category not found");
  }
  category.status = "inactive";
  await category.save();
  return { message: "Category deactivated successfully" };
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
