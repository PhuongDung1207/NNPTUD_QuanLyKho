const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const outboundOrderSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 40
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["draft", "pending", "shipped", "cancelled"],
      default: "draft"
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    shippedAt: {
      type: Date
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    totalAmount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  schemaOptions
);

module.exports = mongoose.models.OutboundOrder || mongoose.model("OutboundOrder", outboundOrderSchema);
