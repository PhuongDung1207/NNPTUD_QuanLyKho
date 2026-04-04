const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const stockAdjustmentItemSchema = new mongoose.Schema(
  {
    stockAdjustment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockAdjustment",
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true
    },
    systemQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    countedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    differenceQuantity: {
      type: Number,
      required: true
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  schemaOptions
);

module.exports = mongoose.models.StockAdjustmentItem || mongoose.model("StockAdjustmentItem", stockAdjustmentItemSchema);

