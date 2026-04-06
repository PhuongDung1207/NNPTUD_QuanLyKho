const createError = require("http-errors");
const { ProductVariant, Product, Inventory } = require("../schemas");

async function listVariantsByProduct(productId) {
  const product = await Product.findById(productId);
  if (!product) {
    throw createError(404, "Product not found");
  }

  const variants = await ProductVariant.find({ product: productId, status: "active" });
  return variants;
}

async function createVariant(id, payload) {
  const product = await Product.findById(id);
  if (!product) {
    throw createError(404, "Product not found");
  }

  try {
    const variant = await ProductVariant.create({
      product: id,
      ...payload,
      attributes: payload.attributes || {}
    });

    return variant;
  } catch (error) {
    if (error.code === 11000) {
      throw createError(409, "SKU or Barcode already exists for this variant");
    }
    throw error;
  }
}

async function updateVariant(variantId, payload) {
  const variant = await ProductVariant.findByIdAndUpdate(
    variantId,
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!variant) {
    throw createError(404, "Variant not found");
  }

  return variant;
}

async function deleteVariant(variantId) {
  const variant = await ProductVariant.findById(variantId);
  if (!variant) {
    throw createError(404, "Variant not found");
  }

  variant.status = "inactive";
  await variant.save();

  return { message: "Variant deactivated successfully" };
}

module.exports = {
  listVariantsByProduct,
  createVariant,
  updateVariant,
  deleteVariant
};
