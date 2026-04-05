const createError = require("http-errors");

const { BatchLot, Product, Warehouse } = require("../schemas");

const batchLotPopulate = [
  {
    path: "product",
    select: "name sku barcode tracking status",
    populate: [
      { path: "category", select: "name code slug" },
      { path: "brand", select: "name code slug" },
      { path: "uom", select: "name code symbol precision" }
    ]
  },
  { path: "warehouse", select: "name code contactPhone contactEmail status" }
];

function removeUndefinedFields(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function getDuplicateKeyMessage(error) {
  const field = Object.keys(error.keyPattern || {})[0] || "field";

  return `${field} already exists`;
}

function normalizeLotCode(lotCode) {
  return String(lotCode || "").trim().toUpperCase();
}

function isExpiredByDate(expiryDate) {
  return Boolean(expiryDate) && new Date(expiryDate).getTime() < Date.now();
}

function calculateRemainingDays(expiryDate) {
  if (!expiryDate) {
    return null;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / millisecondsPerDay);
}

function buildBatchLotResponse(batchLot) {
  const batchLotObject = batchLot.toObject ? batchLot.toObject() : batchLot;

  return {
    ...batchLotObject,
    isExpiredByDate: isExpiredByDate(batchLotObject.expiryDate),
    remainingDays: calculateRemainingDays(batchLotObject.expiryDate)
  };
}

async function ensureReferenceExists(Model, id, label) {
  const document = await Model.findById(id);

  if (!document) {
    throw createError(400, `${label} not found`);
  }
}

async function syncExpiredBatchLots(filter = {}) {
  const query = {
    ...filter,
    expiryDate: { $lt: new Date() },
    status: { $ne: "expired" }
  };

  await BatchLot.updateMany(query, { status: "expired" });
}

function ensureManufactureDateBeforeExpiry(manufactureDate, expiryDate) {
  if (manufactureDate && expiryDate && new Date(manufactureDate) > new Date(expiryDate)) {
    throw createError(400, "manufactureDate must be before or equal to expiryDate");
  }
}

function resolveBatchLotStatus(expiryDate, requestedStatus) {
  if (isExpiredByDate(expiryDate)) {
    return "expired";
  }

  return requestedStatus || "available";
}

async function getBatchLotDocument(id) {
  await syncExpiredBatchLots({ _id: id });

  const batchLot = await BatchLot.findById(id).populate(batchLotPopulate);

  if (!batchLot) {
    throw createError(404, "Batch lot not found");
  }

  return buildBatchLotResponse(batchLot);
}

async function listBatchLots(filters = {}) {
  await syncExpiredBatchLots();

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

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.lotCode) {
    query.lotCode = { $regex: filters.lotCode, $options: "i" };
  }

  if (filters.expiryDate) {
    const expiryDate = new Date(filters.expiryDate);
    const nextDate = new Date(expiryDate);
    nextDate.setDate(nextDate.getDate() + 1);

    query.expiryDate = {
      $gte: expiryDate,
      $lt: nextDate
    };
  }

  const [batchLots, total] = await Promise.all([
    BatchLot.find(query).populate(batchLotPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BatchLot.countDocuments(query)
  ]);

  return {
    message: "Batch lots fetched successfully",
    data: batchLots.map(buildBatchLotResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function getBatchLotById(id) {
  return getBatchLotDocument(id);
}

async function createBatchLot(payload) {
  try {
    await Promise.all([
      ensureReferenceExists(Product, payload.product, "product"),
      ensureReferenceExists(Warehouse, payload.warehouse, "warehouse")
    ]);

    ensureManufactureDateBeforeExpiry(payload.manufactureDate, payload.expiryDate);

    const batchLot = await BatchLot.create(
      removeUndefinedFields({
        product: payload.product,
        warehouse: payload.warehouse,
        lotCode: normalizeLotCode(payload.lotCode),
        manufactureDate: payload.manufactureDate,
        expiryDate: payload.expiryDate,
        quantity: Number(payload.quantity),
        status: resolveBatchLotStatus(payload.expiryDate, payload.status)
      })
    );

    return getBatchLotDocument(batchLot._id);
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, getDuplicateKeyMessage(error));
    }

    throw error;
  }
}

async function updateBatchLotById(id, payload) {
  try {
    await syncExpiredBatchLots({ _id: id });

    const batchLot = await BatchLot.findById(id);

    if (!batchLot) {
      throw createError(404, "Batch lot not found");
    }

    const nextProduct = payload.product || batchLot.product;
    const nextWarehouse = payload.warehouse || batchLot.warehouse;
    const nextManufactureDate = payload.manufactureDate === undefined ? batchLot.manufactureDate : payload.manufactureDate;
    const nextExpiryDate = payload.expiryDate === undefined ? batchLot.expiryDate : payload.expiryDate;
    const nextStatus = payload.status || batchLot.status;

    await Promise.all([
      ensureReferenceExists(Product, nextProduct, "product"),
      ensureReferenceExists(Warehouse, nextWarehouse, "warehouse")
    ]);

    ensureManufactureDateBeforeExpiry(nextManufactureDate, nextExpiryDate);

    if (isExpiredByDate(nextExpiryDate) && payload.status && payload.status !== "expired") {
      throw createError(409, "Expired batch lot cannot be changed to available or blocked");
    }

    Object.assign(
      batchLot,
      removeUndefinedFields({
        product: payload.product,
        warehouse: payload.warehouse,
        lotCode: payload.lotCode ? normalizeLotCode(payload.lotCode) : undefined,
        manufactureDate: payload.manufactureDate,
        expiryDate: payload.expiryDate,
        quantity: payload.quantity !== undefined ? Number(payload.quantity) : undefined,
        status: resolveBatchLotStatus(nextExpiryDate, nextStatus)
      })
    );

    await batchLot.save();

    return getBatchLotDocument(batchLot._id);
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, getDuplicateKeyMessage(error));
    }

    throw error;
  }
}

async function updateBatchLotStatus(id, statusPayload) {
  await syncExpiredBatchLots({ _id: id });

  const batchLot = await BatchLot.findById(id);

  if (!batchLot) {
    throw createError(404, "Batch lot not found");
  }

  if (isExpiredByDate(batchLot.expiryDate) && statusPayload.status !== "expired") {
    throw createError(409, "Expired batch lot cannot be changed to available or blocked");
  }

  batchLot.status = resolveBatchLotStatus(batchLot.expiryDate, statusPayload.status);
  await batchLot.save();

  return getBatchLotDocument(batchLot._id);
}

module.exports = {
  listBatchLots,
  getBatchLotById,
  createBatchLot,
  updateBatchLotById,
  updateBatchLotStatus
};
