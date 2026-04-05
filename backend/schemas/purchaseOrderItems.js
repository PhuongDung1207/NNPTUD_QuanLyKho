const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    receivedQuantity: {
      type: Number,
      min: 0,
      default: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    taxRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  schemaOptions
);

module.exports = mongoose.models.PurchaseOrderItem || mongoose.model("PurchaseOrderItem", purchaseOrderItemSchema);

