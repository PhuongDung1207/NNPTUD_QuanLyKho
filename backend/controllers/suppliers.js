const createError = require("http-errors");
const { Supplier } = require("../schemas");

function cleanUndefined(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function parseDuplicateKey(error) {
  const field = Object.keys(error.keyPattern || {})[0] || "field";
  return `${field} already exists`;
}

async function listSuppliers(filters = {}) {
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

  const [suppliers, total] = await Promise.all([
    Supplier.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Supplier.countDocuments(query)
  ]);

  return {
    message: "Suppliers fetched successfully",
    data: suppliers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function getSupplierById(id) {
  const supplier = await Supplier.findById(id);

  if (!supplier) {
    throw createError(404, "Supplier not found");
  }

  return supplier;
}

async function createSupplier(payload) {
  try {
    const supplier = await Supplier.create(cleanUndefined(payload));
    return supplier;
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }
    throw error;
  }
}

async function updateSupplierById(id, payload) {
  const supplier = await Supplier.findById(id);

  if (!supplier) {
    throw createError(404, "Supplier not found");
  }

  try {
    Object.assign(supplier, cleanUndefined(payload));
    await supplier.save();

    return supplier;
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }
    throw error;
  }
}

async function archiveSupplierById(id) {
  const supplier = await Supplier.findById(id);

  if (!supplier) {
    throw createError(404, "Supplier not found");
  }

  supplier.status = "inactive";
  await supplier.save();

  return supplier;
}

module.exports = {
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplierById,
  archiveSupplierById
};
