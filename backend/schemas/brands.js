const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const slugify = require("../utils/slugify");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 40
    },
    slug: {
      type: String,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    countryOfOrigin: {
      type: String,
      trim: true,
      maxlength: 120
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  schemaOptions
);

brandSchema.pre("validate", function createSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  return next();
});

module.exports = mongoose.models.Brand || mongoose.model("Brand", brandSchema);

