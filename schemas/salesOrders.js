const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const salesOrderSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 40
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer"
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    status: {
      type: String,
      enum: ["draft", "confirmed", "picking", "shipped", "completed", "cancelled"],
      default: "draft"
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
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    orderDate: {
      type: Date,
      default: Date.now
    }
  },
  schemaOptions
);

module.exports = mongoose.models.SalesOrder || mongoose.model("SalesOrder", salesOrderSchema);

