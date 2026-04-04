const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const stockAdjustmentSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 40
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    status: {
      type: String,
      enum: ["draft", "confirmed", "cancelled"],
      default: "draft"
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  schemaOptions
);

module.exports = mongoose.models.StockAdjustment || mongoose.model("StockAdjustment", stockAdjustmentSchema);

