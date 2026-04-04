const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const purchaseOrderSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 40
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },
    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "received", "cancelled"],
      default: "draft"
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    expectedDate: {
      type: Date
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    subtotal: {
      type: Number,
      min: 0,
      default: 0
    },
    taxAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    totalAmount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  schemaOptions
);

module.exports = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", purchaseOrderSchema);

