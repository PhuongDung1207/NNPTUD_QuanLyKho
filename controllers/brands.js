const createError = require("http-errors");
const { Brand } = require("../schemas");

function cleanUndefined(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function parseDuplicateKey(error) {
  const field = Object.keys(error.keyPattern || {})[0] || "field";
  return `${field} already exists`;
}

async function listBrands(filters = {}) {
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

  const [brands, total] = await Promise.all([
    Brand.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Brand.countDocuments(query)
  ]);

  return {
    message: "Brands fetched successfully",
    data: brands,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function getBrandById(id) {
  const brand = await Brand.findById(id);

  if (!brand) {
    throw createError(404, "Brand not found");
  }

  return brand;
}

async function createBrand(payload) {
  try {
    const brand = await Brand.create(cleanUndefined(payload));
    return brand;
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }
    throw error;
  }
}

async function updateBrandById(id, payload) {
  const brand = await Brand.findById(id);

  if (!brand) {
    throw createError(404, "Brand not found");
  }

  try {
    Object.assign(brand, cleanUndefined(payload));
    await brand.save();

    return brand;
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }
    throw error;
  }
}

async function archiveBrandById(id) {
  const brand = await Brand.findById(id);

  if (!brand) {
    throw createError(404, "Brand not found");
  }

  brand.status = "inactive";
  await brand.save();

  return brand;
}

module.exports = {
  listBrands,
  getBrandById,
  createBrand,
  updateBrandById,
  archiveBrandById
};
