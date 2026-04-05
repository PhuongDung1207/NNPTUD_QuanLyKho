const mongoose = require("mongoose");

const schemaOptions = {
  timestamps: true,
  versionKey: false
};

const slugify = require("../utils/slugify");

const priceSchema = new mongoose.Schema(
  {
    cost: {
      type: Number,
      min: 0,
      default: 0
    },
    sale: {
      type: Number,
      min: 0,
      default: 0
    },
    wholesale: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  { _id: false }
);

const dimensionSchema = new mongoose.Schema(
  {
    weight: {
      type: Number,
      min: 0,
      default: 0
    },
    length: {
      type: Number,
      min: 0,
      default: 0
    },
    width: {
      type: Number,
      min: 0,
      default: 0
    },
    height: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 64
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      maxlength: 64
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 180
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand"
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier"
    },
    uom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit"
    },
    price: {
      type: priceSchema,
      default: () => ({})
    },
    dimensions: {
      type: dimensionSchema,
      default: () => ({})
    },
    tracking: {
      type: String,
      enum: ["none", "lot", "serial"],
      default: "none"
    },
    imageUrls: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["draft", "active", "inactive", "discontinued"],
      default: "draft"
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  schemaOptions
);

productSchema.index({ name: "text", sku: "text", barcode: "text" });

productSchema.pre("validate", function createSlug(next) {
  if ((this.isModified("name") || !this.slug) && this.name) {
    this.slug = slugify(this.name);
  }

  return next();
});

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);

