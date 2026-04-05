const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 120
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 120
    },
    module: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  schemaOptions
);

module.exports = mongoose.models.Permission || mongoose.model("Permission", permissionSchema);

