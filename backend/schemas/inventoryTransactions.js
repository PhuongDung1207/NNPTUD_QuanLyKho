const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const inventoryTransactionSchema = new mongoose.Schema(
  {
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true
    },
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
    type: {
      type: String,
      required: true,
      enum: [
        "opening_balance",
        "import",
        "export",
        "adjustment",
        "transfer_in",
        "transfer_out",
        "sale",
        "return"
      ]
    },
    quantity: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0
    },
    referenceType: {
      type: String,
      trim: true,
      maxlength: 80
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  schemaOptions
);

module.exports = mongoose.models.InventoryTransaction || mongoose.model("InventoryTransaction", inventoryTransactionSchema);

