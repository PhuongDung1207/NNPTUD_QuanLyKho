const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      enum: ["admin", "manager", "staff", "viewer"]
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 60
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission"
      }
    ]
  },
  schemaOptions
);

module.exports = mongoose.models.Role || mongoose.model("Role", roleSchema);

