const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 80
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 30
    },
    symbol: {
      type: String,
      trim: true,
      maxlength: 20
    },
    precision: {
      type: Number,
      min: 0,
      max: 6,
      default: 0
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  schemaOptions
);

module.exports = mongoose.models.Unit || mongoose.model("Unit", unitSchema);

