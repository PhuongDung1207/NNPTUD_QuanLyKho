const mongoose = require("mongoose");
const createError = require("http-errors");

const {
  TransferOrder,
  TransferOrderItem,
  Warehouse,
  Product,
  Inventory,
  InventoryTransaction
} = require("../schemas");
const { assertAdminUser, assertAdminOrOwner, isAdminUser } = require("../utils/orderAccess");

const transferOrderPopulate = [
  { path: "fromWarehouse", select: "name code status contactPhone contactEmail" },
  { path: "toWarehouse", select: "name code status contactPhone contactEmail" },
  { path: "requestedBy", select: "fullName username email status" },
  { path: "approvedBy", select: "fullName username email status" }
];

const transferOrderItemPopulate = [
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

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function formatDateSegment(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function normalizeItem(item) {
  return {
    product: item.product,
    quantityRequested: Number(item.quantityRequested),
    quantityShipped: Number(item.quantityShipped || 0),
    quantityReceived: Number(item.quantityReceived || 0),
    note: item.note
  };
}

async function generateTransferOrderCode(session) {
  const prefix = `TO-${formatDateSegment()}-`;
  const regex = new RegExp(`^${prefix}`);
  const count = await TransferOrder.countDocuments({ code: regex }).session(session);
  const code = `${prefix}${String(count + 1).padStart(3, "0")}`;
  const exists = await TransferOrder.exists({ code }).session(session);

  if (!exists) {
    return code;
  }

  for (let index = count + 2; index < count + 50; index += 1) {
    const nextCode = `${prefix}${String(index).padStart(3, "0")}`;
    const duplicated = await TransferOrder.exists({ code: nextCode }).session(session);

    if (!duplicated) {
      return nextCode;
    }
  }

  throw createError(500, "Unable to generate transfer order code");
}

async function assertReferenceExists(Model, id, label, session) {
  const document = await Model.findById(id).session(session);

  if (!document) {
    throw createError(400, `${label} not found`);
  }
}

async function validateTransferOrderReferences(payload, session) {
  if (String(payload.fromWarehouse) === String(payload.toWarehouse)) {
    throw createError(400, "fromWarehouse and toWarehouse must be different");
  }

  await Promise.all([
    assertReferenceExists(Warehouse, payload.fromWarehouse, "fromWarehouse", session),
    assertReferenceExists(Warehouse, payload.toWarehouse, "toWarehouse", session)
  ]);

  const productIds = [...new Set((payload.items || []).map((item) => String(item.product)))];
  await Promise.all(productIds.map((productId) => assertReferenceExists(Product, productId, "product", session)));
}

async function getTransferOrderDocument(id, session = null) {
  const orderQuery = TransferOrder.findById(id).populate(transferOrderPopulate);
  const itemQuery = TransferOrderItem.find({ transferOrder: id }).populate(transferOrderItemPopulate).sort({ createdAt: 1 });

  if (session) {
    orderQuery.session(session);
    itemQuery.session(session);
  }

  const [order, items] = await Promise.all([orderQuery, itemQuery]);

  if (!order) {
    throw createError(404, "Transfer order not found");
  }

  return {
    ...order.toObject(),
    items
  };
}

async function replaceTransferOrderItems(orderId, items, session) {
  await TransferOrderItem.deleteMany({ transferOrder: orderId }).session(session);

  const normalizedItems = items.map((item) => normalizeItem(item));

  await TransferOrderItem.insertMany(
    normalizedItems.map((item) => ({
      transferOrder: orderId,
      ...item
    })),
    { session }
  );

  return normalizedItems;
}

async function createTransferOrder(payload, user) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await validateTransferOrderReferences(payload, session);

    const normalizedItems = payload.items.map((item) => normalizeItem(item));
    const code = payload.code ? normalizeCode(payload.code) : await generateTransferOrderCode(session);

    const [order] = await TransferOrder.create(
      [
        cleanUndefined({
          code,
          fromWarehouse: payload.fromWarehouse,
          toWarehouse: payload.toWarehouse,
          requestedBy: user?._id,
          note: payload.note
        })
      ],
      { session }
    );

    await TransferOrderItem.insertMany(
      normalizedItems.map((item) => ({
        transferOrder: order._id,
        ...item
      })),
      { session }
    );

    const data = await getTransferOrderDocument(order._id, session);

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

async function listTransferOrders(filters = {}) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.fromWarehouse) {
    query.fromWarehouse = filters.fromWarehouse;
  }

  if (filters.toWarehouse) {
    query.toWarehouse = filters.toWarehouse;
  }

  if (filters.code) {
    query.code = { $regex: filters.code, $options: "i" };
  }

  const [orders, total] = await Promise.all([
    TransferOrder.find(query).populate(transferOrderPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    TransferOrder.countDocuments(query)
  ]);

  return {
    message: "Transfer orders fetched successfully",
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function getTransferOrderById(id) {
  return getTransferOrderDocument(id);
}

async function updateTransferOrderById(id, payload, user) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await TransferOrder.findById(id).session(session);

    if (!order) {
      throw createError(404, "Transfer order not found");
    }

    assertAdminOrOwner(user, order.requestedBy, "You can only update transfer orders that you created");

    if (order.status !== "draft") {
      throw createError(409, "Only draft transfer orders can be updated");
    }

    await validateTransferOrderReferences(payload, session);

    const normalizedItems = payload.items.map((item) => normalizeItem(item));

    Object.assign(
      order,
      cleanUndefined({
        code: payload.code ? normalizeCode(payload.code) : undefined,
        fromWarehouse: payload.fromWarehouse,
        toWarehouse: payload.toWarehouse,
        note: payload.note
      })
    );

    await order.save({ session });
    await replaceTransferOrderItems(order._id, normalizedItems, session);

    const data = await getTransferOrderDocument(order._id, session);

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

async function submitTransferOrder(id, user) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await TransferOrder.findById(id).session(session);

    if (!order) {
      throw createError(404, "Transfer order not found");
    }

    assertAdminOrOwner(user, order.requestedBy, "You can only submit transfer orders that you created");

    if (order.status !== "draft") {
      throw createError(409, "Only draft transfer orders can be submitted");
    }

    const items = await TransferOrderItem.find({ transferOrder: order._id }).session(session);

    if (!items.length) {
      throw createError(409, "Transfer order must have at least one item before submit");
    }

    for (const item of items) {
      const inventory = await Inventory.findOne({
        product: item.product,
        warehouse: order.fromWarehouse
      }).session(session);

      if (!inventory) {
        throw createError(409, "Inventory not found in source warehouse");
      }

      if (inventory.availableQuantity < Number(item.quantityRequested)) {
        throw createError(409, "Available quantity is not enough to submit transfer order");
      }

      inventory.reservedQuantity += Number(item.quantityRequested);
      await inventory.save({ session });
    }

    order.status = "pending";
    await order.save({ session });

    const data = await getTransferOrderDocument(order._id, session);

    await session.commitTransaction();

    return data;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

async function shipTransferOrder(id, user) {
  assertAdminUser(user, "Only admin can approve transfer orders");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await TransferOrder.findById(id).session(session);

    if (!order) {
      throw createError(404, "Transfer order not found");
    }

    if (order.status !== "pending") {
      throw createError(409, "Only pending transfer orders can be shipped");
    }

    const items = await TransferOrderItem.find({ transferOrder: order._id }).session(session);

    if (!items.length) {
      throw createError(409, "Transfer order has no items to ship");
    }

    for (const item of items) {
      const inventory = await Inventory.findOne({
        product: item.product,
        warehouse: order.fromWarehouse
      }).session(session);

      if (!inventory) {
        throw createError(409, "Inventory not found in source warehouse");
      }

      if (inventory.reservedQuantity < Number(item.quantityRequested)) {
        throw createError(409, "Reserved quantity is not enough to ship transfer order");
      }

      if (inventory.quantityOnHand < Number(item.quantityRequested)) {
        throw createError(409, "Quantity on hand is not enough to ship transfer order");
      }

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
            warehouse: order.fromWarehouse,
            type: "transfer_out",
            quantity: -Number(item.quantityRequested),
            balanceAfter: inventory.quantityOnHand,
            referenceType: "transfer_order",
            referenceId: order._id,
            note: `Shipped from transfer order ${order.code}`,
            createdBy: user?._id
          }
        ],
        { session }
      );
    }

    order.status = "in_transit";
    order.shippedAt = new Date();
    order.approvedBy = user?._id;
    await order.save({ session });

    const data = await getTransferOrderDocument(order._id, session);

    await session.commitTransaction();

    return data;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

async function receiveTransferOrder(id, user) {
  assertAdminUser(user, "Only admin can complete transfer orders");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await TransferOrder.findById(id).session(session);

    if (!order) {
      throw createError(404, "Transfer order not found");
    }

    if (order.status !== "in_transit") {
      throw createError(409, "Only in-transit transfer orders can be received");
    }

    const items = await TransferOrderItem.find({ transferOrder: order._id }).session(session);

    if (!items.length) {
      throw createError(409, "Transfer order has no items to receive");
    }

    for (const item of items) {
      if (!item.quantityShipped) {
        throw createError(409, "Transfer order item has not been shipped");
      }

      let inventory = await Inventory.findOne({
        product: item.product,
        warehouse: order.toWarehouse
      }).session(session);

      if (!inventory) {
        [inventory] = await Inventory.create(
          [
            {
              product: item.product,
              warehouse: order.toWarehouse
            }
          ],
          { session }
        );
      }

      inventory.quantityOnHand += Number(item.quantityShipped);
      inventory.lastStockedAt = new Date();
      await inventory.save({ session });

      item.quantityReceived = item.quantityShipped;
      await item.save({ session });

      await InventoryTransaction.create(
        [
          {
            inventory: inventory._id,
            product: item.product,
            warehouse: order.toWarehouse,
            type: "transfer_in",
            quantity: Number(item.quantityShipped),
            balanceAfter: inventory.quantityOnHand,
            referenceType: "transfer_order",
            referenceId: order._id,
            note: `Received from transfer order ${order.code}`,
            createdBy: user?._id
          }
        ],
        { session }
      );
    }

    order.status = "completed";
    order.receivedAt = new Date();
    await order.save({ session });

    const data = await getTransferOrderDocument(order._id, session);

    await session.commitTransaction();

    return data;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

async function cancelTransferOrder(id, user) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await TransferOrder.findById(id).session(session);

    if (!order) {
      throw createError(404, "Transfer order not found");
    }

    if (!isAdminUser(user)) {
      assertAdminOrOwner(user, order.requestedBy, "You can only cancel draft transfer orders that you created");

      if (order.status !== "draft") {
        throw createError(403, "Only admin can reject submitted transfer orders");
      }
    }

    if (order.status === "cancelled") {
      throw createError(409, "Transfer order has already been cancelled");
    }

    if (order.status === "completed") {
      throw createError(409, "Completed transfer orders cannot be cancelled");
    }

    if (order.status === "in_transit") {
      throw createError(409, "In-transit transfer orders cannot be cancelled");
    }

    if (order.status === "pending") {
      const items = await TransferOrderItem.find({ transferOrder: order._id }).session(session);

      for (const item of items) {
        const inventory = await Inventory.findOne({
          product: item.product,
          warehouse: order.fromWarehouse
        }).session(session);

        if (inventory) {
          inventory.reservedQuantity = Math.max(inventory.reservedQuantity - Number(item.quantityRequested), 0);
          await inventory.save({ session });
        }
      }
    }

    order.status = "cancelled";
    await order.save({ session });

    const data = await getTransferOrderDocument(order._id, session);

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
  createTransferOrder,
  listTransferOrders,
  getTransferOrderById,
  updateTransferOrderById,
  submitTransferOrder,
  shipTransferOrder,
  receiveTransferOrder,
  cancelTransferOrder
};
