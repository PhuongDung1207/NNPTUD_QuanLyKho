const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const warehouseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 40
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    description: {
      type: String,
      trim: true,
      maxlength: 800
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  schemaOptions
);

module.exports = mongoose.models.Warehouse || mongoose.model("Warehouse", warehouseSchema);

