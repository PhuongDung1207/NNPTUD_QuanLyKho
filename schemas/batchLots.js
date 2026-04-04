const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const batchLotSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },
    lotCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 50
    },
    manufactureDate: {
      type: Date
    },
    expiryDate: {
      type: Date
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["available", "blocked", "expired"],
      default: "available"
    }
  },
  schemaOptions
);

module.exports = mongoose.models.BatchLot || mongoose.model("BatchLot", batchLotSchema);

