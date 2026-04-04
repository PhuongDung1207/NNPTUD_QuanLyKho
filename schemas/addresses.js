const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: 80
    },
    contactName: {
      type: String,
      trim: true,
      maxlength: 120
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      trim: true,
      default: "Vietnam",
      maxlength: 120
    },
    province: {
      type: String,
      trim: true,
      maxlength: 120
    },
    district: {
      type: String,
      trim: true,
      maxlength: 120
    },
    ward: {
      type: String,
      trim: true,
      maxlength: 120
    },
    street: {
      type: String,
      trim: true,
      maxlength: 250
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 20
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  schemaOptions
);

module.exports = mongoose.models.Address || mongoose.model("Address", addressSchema);

