const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const inventorySchema = new mongoose.Schema(
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
    quantityOnHand: {
      type: Number,
      min: 0,
      default: 0
    },
    reservedQuantity: {
      type: Number,
      min: 0,
      default: 0
    },
    availableQuantity: {
      type: Number,
      min: 0,
      default: 0
    },
    reorderPoint: {
      type: Number,
      min: 0,
      default: 0
    },
    minStockLevel: {
      type: Number,
      min: 0,
      default: 0
    },
    maxStockLevel: {
      type: Number,
      min: 0,
      default: 0
    },
    lastStockedAt: {
      type: Date
    }
  },
  schemaOptions
);

inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });

inventorySchema.pre("validate", function validateReservedQuantity(next) {
  if (this.reservedQuantity > this.quantityOnHand) {
    return next(new Error("reservedQuantity cannot be greater than quantityOnHand"));
  }

  return next();
});

inventorySchema.pre("save", function syncAvailableQuantity(next) {
  this.availableQuantity = Math.max(this.quantityOnHand - this.reservedQuantity, 0);
  return next();
});

module.exports = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);

