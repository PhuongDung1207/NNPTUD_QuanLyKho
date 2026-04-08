const mongoose = require("mongoose");
const createError = require("http-errors");

const {
  OutboundOrder,
  OutboundOrderItem,
  Warehouse,
  Product,
  Inventory,
  InventoryTransaction
} = require("../schemas");

const outboundOrderPopulate = [
  { path: "warehouse", select: "name code status contactPhone contactEmail" },
  { path: "issuedBy", select: "fullName username email status" }
];

const outboundOrderItemPopulate = [
  {
    path: "product",
    select: "name sku barcode status tracking",
    populate: [
      { path: "category", select: "name code slug" },
      { path: "brand", select: "name code slug" },
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

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function formatDateSegment(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function generateOutboundOrderCode(session) {
  const prefix = `OUT-${formatDateSegment()}-`;
  const count = await OutboundOrder.countDocuments({ code: new RegExp(`^${prefix}`) }).session(session);
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

async function getOutboundOrderDocument(id, session = null) {
  const orderQuery = OutboundOrder.findById(id).populate(outboundOrderPopulate);
  const itemQuery = OutboundOrderItem.find({ outboundOrder: id }).populate(outboundOrderItemPopulate).sort({ createdAt: 1 });

  if (session) {
    orderQuery.session(session);
    itemQuery.session(session);
  }

  const [order, items] = await Promise.all([orderQuery, itemQuery]);

  if (!order) {
    throw createError(404, "Outbound order not found");
  }

  return {
    ...order.toObject(),
    items
  };
}

async function createOutboundOrder(payload, user) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const code = payload.code ? normalizeCode(payload.code) : await generateOutboundOrderCode(session);
    
    const [order] = await OutboundOrder.create(
      [
        cleanUndefined({
          code,
          customerName: payload.customerName,
          warehouse: payload.warehouse,
          issuedBy: user?._id,
          note: payload.note,
          totalAmount: payload.totalAmount || 0
        })
      ],
      { session }
    );

    if (payload.items && payload.items.length) {
      await OutboundOrderItem.insertMany(
        payload.items.map((item) => ({
          outboundOrder: order._id,
          product: item.product,
          quantityRequested: item.quantityRequested,
          price: item.price || 0,
          note: item.note
        })),
        { session }
      );
    }

    const data = await getOutboundOrderDocument(order._id, session);
    await session.commitTransaction();
    return data;
  } catch (error) {
    await session.abortTransaction();
    if (error?.code === 11000) throw createError(409, parseDuplicateKey(error));
    throw error;
  } finally {
    await session.endSession();
  }
}

async function listOutboundOrders(filters = {}) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.warehouse) query.warehouse = filters.warehouse;
  if (filters.code) query.code = { $regex: filters.code, $options: "i" };

  const [orders, total] = await Promise.all([
    OutboundOrder.find(query).populate(outboundOrderPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    OutboundOrder.countDocuments(query)
  ]);

  return {
    message: "Outbound orders fetched successfully",
    data: orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
}

async function getOutboundOrderById(id) {
  return getOutboundOrderDocument(id);
}

async function submitOutboundOrder(id) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await OutboundOrder.findById(id).session(session);
    if (!order) throw createError(404, "Outbound order not found");
    if (order.status !== "draft") throw createError(409, "Only draft orders can be submitted");

    const items = await OutboundOrderItem.find({ outboundOrder: order._id }).session(session);
    if (!items.length) throw createError(409, "Order must have at least one item before submit");

    for (const item of items) {
      const inventory = await Inventory.findOne({
        product: item.product,
        warehouse: order.warehouse
      }).session(session);

      if (!inventory) throw createError(409, `Inventory for product ${item.product} not found in source warehouse`);
      
      const available = inventory.quantityOnHand - inventory.reservedQuantity;
      if (available < item.quantityRequested) {
        throw createError(409, `Quantity not enough for product ${item.product}. Available: ${available}`);
      }

      inventory.reservedQuantity += Number(item.quantityRequested);
      await inventory.save({ session });
    }

    order.status = "pending";
    await order.save({ session });

    const data = await getOutboundOrderDocument(order._id, session);
    await session.commitTransaction();
    return data;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

async function shipOutboundOrder(id, user) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await OutboundOrder.findById(id).session(session);
    if (!order) throw createError(404, "Outbound order not found");
    if (order.status !== "pending") throw createError(409, "Only pending orders can be shipped");

    const items = await OutboundOrderItem.find({ outboundOrder: order._id }).session(session);

    for (const item of items) {
      const inventory = await Inventory.findOne({
        product: item.product,
        warehouse: order.warehouse
      }).session(session);

      if (!inventory) throw createError(409, "Inventory not found");

      inventory.quantityOnHand -= Number(item.quantityRequested);
      inventory.reservedQuantity -= Number(item.quantityRequested);
      await inventory.save({ session });

      item.quantityShipped = item.quantityRequested;
      await item.save({ session });

      await InventoryTransaction.create(
        [
          {
            inventory: inventory._id,
            product: item.product,
            warehouse: order.warehouse,
            type: "export",
            quantity: -Number(item.quantityRequested),
            balanceAfter: inventory.quantityOnHand,
            referenceType: "outbound_order",
            referenceId: order._id,
            note: `Shipped from outbound order ${order.code}`,
            createdBy: user?._id
          }
        ],
        { session }
      );
    }

    order.status = "shipped";
    order.shippedAt = new Date();
    await order.save({ session });

    const data = await getOutboundOrderDocument(order._id, session);
    await session.commitTransaction();
    return data;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

async function cancelOutboundOrder(id) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await OutboundOrder.findById(id).session(session);
    if (!order) throw createError(404, "Outbound order not found");
    if (["shipped", "cancelled"].includes(order.status)) {
      throw createError(409, `Cannot cancel order in ${order.status} status`);
    }

    if (order.status === "pending") {
      const items = await OutboundOrderItem.find({ outboundOrder: order._id }).session(session);
      for (const item of items) {
        const inventory = await Inventory.findOne({
          product: item.product,
          warehouse: order.warehouse
        }).session(session);

        if (inventory) {
          inventory.reservedQuantity = Math.max(inventory.reservedQuantity - Number(item.quantityRequested), 0);
          await inventory.save({ session });
        }
      }
    }

    order.status = "cancelled";
    await order.save({ session });

    const data = await getOutboundOrderDocument(order._id, session);
    await session.commitTransaction();
    return data;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  createOutboundOrder,
  listOutboundOrders,
  getOutboundOrderById,
  submitOutboundOrder,
  shipOutboundOrder,
  cancelOutboundOrder
};
