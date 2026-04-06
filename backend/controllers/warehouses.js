
const createError = require("http-errors");

const { Warehouse, User, Inventory } = require("../schemas");

const warehousePopulate = [{ path: "manager", select: "fullName username email phone status" }];
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

async function assertManagerExists(managerId) {
  if (!managerId) {
    return;
  }

  const manager = await User.findById(managerId);

  if (!manager) {
    throw createError(400, "manager not found");
  }
}

async function listWarehouses(filters = {}) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { code: { $regex: filters.search, $options: "i" } }
    ];
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.manager) {
    query.manager = filters.manager;
  }

  const [warehouses, total] = await Promise.all([
    Warehouse.find(query).populate(warehousePopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Warehouse.countDocuments(query)
  ]);

  return {
    message: "Warehouses fetched successfully",
    data: warehouses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function getWarehouseById(id) {
  const warehouse = await Warehouse.findById(id).populate(warehousePopulate);

  if (!warehouse) {
    throw createError(404, "Warehouse not found");
  }

  return warehouse;
}

async function getWarehouseInventories(id, filters = {}) {
  await getWarehouseById(id);

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;
  const query = {
    warehouse: id
  };

  if (filters.product) {
    query.product = filters.product;
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
    message: "Warehouse inventories fetched successfully",
    data: inventories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function createWarehouse(payload) {
  try {
    await assertManagerExists(payload.manager);

    const warehouse = await Warehouse.create(cleanUndefined(payload));
    return Warehouse.findById(warehouse._id).populate(warehousePopulate);
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }

    throw error;
  }
}

async function updateWarehouseById(id, payload) {
  const warehouse = await Warehouse.findById(id);

  if (!warehouse) {
    throw createError(404, "Warehouse not found");
  }

  try {
    await assertManagerExists(payload.manager);

    Object.assign(warehouse, cleanUndefined(payload));
    await warehouse.save();

    return Warehouse.findById(warehouse._id).populate(warehousePopulate);
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }

    throw error;
  }
}

async function archiveWarehouseById(id) {
  const warehouse = await Warehouse.findById(id);

  if (!warehouse) {
    throw createError(404, "Warehouse not found");
  }

  warehouse.status = "inactive";
  await warehouse.save();

  return warehouse;
}

module.exports = {
  listWarehouses,
  getWarehouseById,
  getWarehouseInventories,
  createWarehouse,
  updateWarehouseById,
  archiveWarehouseById
};
