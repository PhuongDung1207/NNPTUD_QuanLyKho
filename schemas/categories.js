const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const slugify = require("../utils/slugify");

const categorySchema = new mongoose.Schema(
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
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  schemaOptions
);

categorySchema.pre("validate", function createSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  return next();
});

module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);

