const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const transferOrderSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 40
    },
    fromWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },
    toWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    status: {
      type: String,
      enum: ["draft", "pending", "in_transit", "completed", "cancelled"],
      default: "draft"
    },
    shippedAt: {
      type: Date
    },
    receivedAt: {
      type: Date
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  schemaOptions
);

module.exports = mongoose.models.TransferOrder || mongoose.model("TransferOrder", transferOrderSchema);

