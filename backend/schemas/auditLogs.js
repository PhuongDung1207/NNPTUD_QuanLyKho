const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    module: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    entityName: {
      type: String,
      trim: true,
      maxlength: 120
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 80
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  schemaOptions
);

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

