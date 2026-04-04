const mongoose = require("mongoose");
const createError = require("http-errors");

const {
  Product,
  Inventory,
  InventoryTransaction,
  Warehouse,
  Category,
  Brand,
  Supplier,
  Unit
} = require("../schemas");

const productPopulate = [
  { path: "category", select: "name code slug" },
  { path: "brand", select: "name code slug" },
  { path: "supplier", select: "name code contactName phone email" },
  { path: "uom", select: "name code symbol precision" }
];

const inventoryPopulate = [
  { path: "warehouse", select: "name code contactPhone contactEmail" },
  {
    path: "product",
    populate: productPopulate
  }
];

function cleanUndefined(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function buildPublicFileUrl(origin, pathname) {
  const normalizedOrigin = String(origin || "").replace(/\/$/, "");
  return normalizedOrigin ? `${normalizedOrigin}${pathname}` : pathname;
}

function parseDuplicateKey(error) {
  const field = Object.keys(error.keyPattern || {})[0] || "field";

  return `${field} already exists`;
}

async function assertReferenceExists(Model, id, label, session) {
  if (!id) {
    return;
  }

  const document = await Model.findById(id).session(session);

  if (!document) {
    throw createError(400, `${label} not found`);
  }
}

async function validateProductReferences(payload, session) {
  await Promise.all([
    assertReferenceExists(Warehouse, payload.warehouse, "warehouse", session),
    assertReferenceExists(Category, payload.category, "category", session),
    assertReferenceExists(Brand, payload.brand, "brand", session),
    assertReferenceExists(Supplier, payload.supplier, "supplier", session),
    assertReferenceExists(Unit, payload.uom, "uom", session)
  ]);
}

async function createProductWithInventory(payload) {
  const session = await mongoose.startSession();

  try {
    const {
      warehouse,
      initialQuantity = 0,
      reservedQuantity = 0,
      reorderPoint = 0,
      minStockLevel = 0,
      maxStockLevel = 0,
      openingNote,
      ...productPayload
    } = payload;

    if (reservedQuantity > initialQuantity) {
      throw createError(400, "reservedQuantity cannot be greater than initialQuantity");
    }

    session.startTransaction();

    await validateProductReferences(
      {
        ...productPayload,
        warehouse
      },
      session
    );

    const [product] = await Product.create(
      [
        cleanUndefined({
          ...productPayload,
          price: cleanUndefined(productPayload.price || {}),
          dimensions: cleanUndefined(productPayload.dimensions || {}),
          imageUrls: productPayload.imageUrls || [],
          tags: productPayload.tags || []
        })
      ],
      { session }
    );

    const [inventory] = await Inventory.create(
      [
        {
          product: product._id,
          warehouse,
          quantityOnHand: Number(initialQuantity),
          reservedQuantity: Number(reservedQuantity),
          reorderPoint: Number(reorderPoint),
          minStockLevel: Number(minStockLevel),
          maxStockLevel: Number(maxStockLevel),
          lastStockedAt: Number(initialQuantity) > 0 ? new Date() : undefined
        }
      ],
      { session }
    );

    if (Number(initialQuantity) > 0) {
      await InventoryTransaction.create(
        [
          {
            inventory: inventory._id,
            product: product._id,
            warehouse,
            type: "opening_balance",
            quantity: Number(initialQuantity),
            balanceAfter: Number(initialQuantity),
            note: openingNote || "Initial stock created together with product"
          }
        ],
        { session }
      );
    }

    const populatedInventory = await Inventory.findById(inventory._id)
      .populate(inventoryPopulate)
      .session(session);

    await session.commitTransaction();

    return populatedInventory;
  } catch (error) {
    await session.abortTransaction();

    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

async function listProducts(filters = {}) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;

  const query = {
    deletedAt: null
  };

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { sku: { $regex: filters.search, $options: "i" } },
      { barcode: { $regex: filters.search, $options: "i" } }
    ];
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.brand) {
    query.brand = filters.brand;
  }

  if (filters.supplier) {
    query.supplier = filters.supplier;
  }

  if (filters.warehouse || String(filters.lowStock) === "true") {
    const inventoryQuery = {};

    if (filters.warehouse) {
      inventoryQuery.warehouse = filters.warehouse;
    }

    if (String(filters.lowStock) === "true") {
      inventoryQuery.$expr = { $lte: ["$quantityOnHand", "$reorderPoint"] };
    }

    const productIds = await Inventory.find(inventoryQuery).distinct("product");

    query._id = { $in: productIds };
  }

  const [products, total] = await Promise.all([
    Product.find(query).populate(productPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(query)
  ]);

  return {
    message: "Products fetched successfully",
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function getProductById(id, session = null) {
  const productQuery = Product.findOne({
    _id: id,
    deletedAt: null
  }).populate(productPopulate);

  const inventoriesQuery = Inventory.find({ product: id }).populate("warehouse", "name code contactPhone contactEmail");

  if (session) {
    productQuery.session(session);
    inventoriesQuery.session(session);
  }

  const [product, inventories] = await Promise.all([productQuery, inventoriesQuery]);

  if (!product) {
    throw createError(404, "Product not found");
  }

  return {
    product,
    inventories
  };
}

async function uploadProductImages(files, options = {}) {
  if (!Array.isArray(files) || !files.length) {
    throw createError(400, "At least one image file is required");
  }

  return files.map((file) => {
    const filePath = `/uploads/products/${file.filename}`;

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: filePath,
      url: buildPublicFileUrl(options.origin, filePath)
    };
  });
}

async function updateProductById(id, payload) {
  const session = await mongoose.startSession();
  const {
    warehouse,
    reorderPoint,
    minStockLevel,
    maxStockLevel,
    ...productPayload
  } = payload;

  try {
    session.startTransaction();

    const product = await Product.findOne({
      _id: id,
      deletedAt: null
    }).session(session);

    if (!product) {
      throw createError(404, "Product not found");
    }

    await validateProductReferences(
      {
        ...productPayload,
        warehouse
      },
      session
    );

    Object.assign(
      product,
      cleanUndefined({
        ...productPayload,
        price: productPayload.price ? cleanUndefined(productPayload.price) : undefined,
        dimensions: productPayload.dimensions ? cleanUndefined(productPayload.dimensions) : undefined
      })
    );

    await product.save({ session });

    const hasInventorySettings =
      reorderPoint !== undefined || minStockLevel !== undefined || maxStockLevel !== undefined;

    if (hasInventorySettings) {
      const inventoryQuery = {
        product: product._id
      };

      if (warehouse) {
        inventoryQuery.warehouse = warehouse;
      }

      const inventory = await Inventory.findOne(inventoryQuery).session(session);

      if (!inventory) {
        throw createError(404, "Inventory not found for product");
      }

      Object.assign(
        inventory,
        cleanUndefined({
          reorderPoint,
          minStockLevel,
          maxStockLevel
        })
      );

      await inventory.save({ session });
    }

    const data = await getProductById(product._id, session);

    await session.commitTransaction();

    return data;
  } catch (error) {
    await session.abortTransaction();

    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

async function archiveProductById(id) {
  const product = await Product.findOne({
    _id: id,
    deletedAt: null
  });

  if (!product) {
    throw createError(404, "Product not found");
  }

  product.status = "discontinued";
  product.deletedAt = new Date();

  await product.save();

  return product;
}

module.exports = {
  createProductWithInventory,
  listProducts,
  getProductById,
  uploadProductImages,
  updateProductById,
  archiveProductById
};
