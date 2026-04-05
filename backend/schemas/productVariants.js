const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 64
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      maxlength: 64
    },
    attributes: {
      type: Map,
      of: String,
      default: {}
    },
    priceOverride: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  schemaOptions
);

module.exports = mongoose.models.ProductVariant || mongoose.model("ProductVariant", productVariantSchema);

