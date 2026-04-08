const createError = require("http-errors");
const { Unit } = require("../schemas");

function cleanUndefined(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function parseDuplicateKey(error) {
  const field = Object.keys(error.keyPattern || {})[0] || "field";
  return `${field} already exists`;
}

async function listUnits(filters = {}) {
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

  const [units, total] = await Promise.all([
    Unit.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Unit.countDocuments(query)
  ]);

  return {
    success: true,
    message: "Units fetched successfully",
    data: units,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function getUnitById(id) {
  const unit = await Unit.findById(id);

  if (!unit) {
    throw createError(404, "Unit not found");
  }

  return unit;
}

async function createUnit(payload) {
  try {
    const unit = await Unit.create(cleanUndefined(payload));
    return unit;
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }
    throw error;
  }
}

async function updateUnitById(id, payload) {
  const unit = await Unit.findById(id);

  if (!unit) {
    throw createError(404, "Unit not found");
  }

  try {
    Object.assign(unit, cleanUndefined(payload));
    await unit.save();

    return unit;
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }
    throw error;
  }
}

async function archiveUnitById(id) {
  const unit = await Unit.findById(id);

  if (!unit) {
    throw createError(404, "Unit not found");
  }

  unit.status = "inactive";
  await unit.save();

  return unit;
}

module.exports = {
  listUnits,
  getUnitById,
  createUnit,
  updateUnitById,
  archiveUnitById
};
