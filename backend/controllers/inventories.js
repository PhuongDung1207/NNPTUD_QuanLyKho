const mongoose = require("mongoose");
const createError = require("http-errors");

const { Inventory, Product, Warehouse, InventoryTransaction } = require("../schemas");
const { withTransaction } = require("../utils/transactionHandler");

const inventoryPopulate = [
  { path: "warehouse", select: "name code status contactPhone contactEmail" },
  {
    path: "product",
    select: "name sku barcode status tracking",
    populate: [
      { path: "category", select: "name code slug" },
      { path: "brand", select: "name code slug" },
      { path: "supplier", select: "name code" },
      { path: "uom", select: "name code symbol precision" }
    ]
  }
];

function cleanUndefined(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function parseDuplicateKey(error) {
  const field = Object.keys(error.keyPattern || {})[0] || "field";
  return `${field} already exists`;
}

async function assertReferenceExists(Model, id, label, session = null) {
  const query = Model.findById(id);

  if (session) {
    query.session(session);
  }

  const document = await query;

  if (!document) {
    throw createError(400, `${label} not found`);
  }
}

async function listInventories(filters = {}) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.product) {
    query.product = filters.product;
  }

  if (filters.warehouse) {
    query.warehouse = filters.warehouse;
  }

  const exprFilters = [];

  if (String(filters.lowStock) === "true") {
    exprFilters.push({ $lte: ["$availableQuantity", "$reorderPoint"] });
  }

  if (String(filters.belowMinStock) === "true") {
    exprFilters.push({ $lte: ["$availableQuantity", "$minStockLevel"] });
  }

  if (exprFilters.length === 1) {
    query.$expr = exprFilters[0];
  }

  if (exprFilters.length > 1) {
    query.$expr = { $and: exprFilters };
  }

  const [inventories, total] = await Promise.all([
    Inventory.find(query).populate(inventoryPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Inventory.countDocuments(query)
  ]);

  return {
    message: "Inventories fetched successfully",
    data: inventories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function getInventoryById(id, session = null) {
  const query = Inventory.findById(id).populate(inventoryPopulate);

  if (session) {
    query.session(session);
  }

  const inventory = await query;

  if (!inventory) {
    throw createError(404, "Inventory not found");
  }

  return inventory;
}

async function createInventory(payload, user) {
  const nextQuantityOnHand = Number(payload.quantityOnHand || 0);
  const nextReservedQuantity = Number(payload.reservedQuantity || 0);

  if (nextReservedQuantity > nextQuantityOnHand) {
    throw createError(400, "reservedQuantity cannot be greater than quantityOnHand");
  }

  return withTransaction(async (session) => {
    await Promise.all([
      assertReferenceExists(Product, payload.product, "product", session),
      assertReferenceExists(Warehouse, payload.warehouse, "warehouse", session)
    ]);

    const [inventory] = await Inventory.create(
      [
        cleanUndefined({
          product: payload.product,
          warehouse: payload.warehouse,
          quantityOnHand: nextQuantityOnHand,
          reservedQuantity: nextReservedQuantity,
          reorderPoint: payload.reorderPoint,
          minStockLevel: payload.minStockLevel,
          maxStockLevel: payload.maxStockLevel,
          lastStockedAt: nextQuantityOnHand > 0 ? new Date() : undefined
        })
      ],
      { session }
    );

    if (nextQuantityOnHand > 0) {
      await InventoryTransaction.create(
        [
          {
            inventory: inventory._id,
            product: inventory.product,
            warehouse: inventory.warehouse,
            type: "opening_balance",
            quantity: nextQuantityOnHand,
            balanceAfter: inventory.quantityOnHand,
            note: payload.openingNote || "Opening balance created manually",
            createdBy: user?._id
          }
        ],
        { session }
      );
    }

    const data = await getInventoryById(inventory._id, session);

    return data;
  }).catch((error) => {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }
    throw error;
  });
}

async function updateInventoryById(id, payload, user) {
  return withTransaction(async (session) => {
    const inventory = await Inventory.findById(id).session(session);

    if (!inventory) {
      throw createError(404, "Inventory not found");
    }

    const previousQuantityOnHand = Number(inventory.quantityOnHand);
    const nextQuantityOnHand = payload.quantityOnHand !== undefined ? Number(payload.quantityOnHand) : previousQuantityOnHand;
    const nextReservedQuantity =
      payload.reservedQuantity !== undefined ? Number(payload.reservedQuantity) : Number(inventory.reservedQuantity);

    if (nextReservedQuantity > nextQuantityOnHand) {
      throw createError(400, "reservedQuantity cannot be greater than quantityOnHand");
    }

    Object.assign(
      inventory,
      cleanUndefined({
        quantityOnHand: payload.quantityOnHand !== undefined ? nextQuantityOnHand : undefined,
        reservedQuantity: payload.reservedQuantity !== undefined ? nextReservedQuantity : undefined,
        reorderPoint: payload.reorderPoint,
        minStockLevel: payload.minStockLevel,
        maxStockLevel: payload.maxStockLevel
      })
    );

    if (nextQuantityOnHand > previousQuantityOnHand) {
      inventory.lastStockedAt = new Date();
    }

    await inventory.save({ session });

    const quantityDiff = nextQuantityOnHand - previousQuantityOnHand;

    if (quantityDiff !== 0) {
      await InventoryTransaction.create(
        [
          {
            inventory: inventory._id,
            product: inventory.product,
            warehouse: inventory.warehouse,
            type: "adjustment",
            quantity: quantityDiff,
            balanceAfter: inventory.quantityOnHand,
            note: payload.adjustmentNote || "Inventory adjusted manually",
            createdBy: user?._id
          }
        ],
        { session }
      );
    }

    const data = await getInventoryById(inventory._id, session);

    return data;
  });
}

module.exports = {
  listInventories,
  getInventoryById,
  createInventory,
  updateInventoryById
};
