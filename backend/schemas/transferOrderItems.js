const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const transferOrderItemSchema = new mongoose.Schema(
  {
    transferOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransferOrder",
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantityRequested: {
      type: Number,
      required: true,
      min: 0
    },
    quantityShipped: {
      type: Number,
      min: 0,
      default: 0
    },
    quantityReceived: {
      type: Number,
      min: 0,
      default: 0
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  schemaOptions
);

module.exports = mongoose.models.TransferOrderItem || mongoose.model("TransferOrderItem", transferOrderItemSchema);

