const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const outboundOrderItemSchema = new mongoose.Schema(
  {
    outboundOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OutboundOrder",
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
      min: 1
    },
    quantityShipped: {
      type: Number,
      default: 0,
      min: 0
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    note: {
      type: String,
      trim: true
    }
  },
  schemaOptions
);

module.exports = mongoose.models.OutboundOrderItem || mongoose.model("OutboundOrderItem", outboundOrderItemSchema);
