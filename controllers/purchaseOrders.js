const mongoose = require("mongoose");
const createError = require("http-errors");

const {
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  Warehouse,
  Product,
  Inventory,
  InventoryTransaction
} = require("../schemas");

const purchaseOrderPopulate = [
  { path: "supplier", select: "name code contactName phone email status" },
  { path: "warehouse", select: "name code contactPhone contactEmail status" },
  { path: "orderedBy", select: "fullName username email status" }
];

const purchaseOrderItemPopulate = [
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

function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function normalizeItem(item) {
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);
  const taxRate = Number(item.taxRate || 0);
  const subtotal = roundCurrency(quantity * unitPrice);
  const taxAmount = roundCurrency((subtotal * taxRate) / 100);

  return {
    product: item.product,
    quantity,
    receivedQuantity: Number(item.receivedQuantity || 0),
    unitPrice,
    taxRate,
    lineTotal: roundCurrency(subtotal + taxAmount)
  };
}

function calculateTotals(items) {
  return items.reduce(
    (totals, item) => {
      const lineSubtotal = roundCurrency(Number(item.quantity) * Number(item.unitPrice));
      const lineTax = roundCurrency((lineSubtotal * Number(item.taxRate || 0)) / 100);

      totals.subtotal = roundCurrency(totals.subtotal + lineSubtotal);
      totals.taxAmount = roundCurrency(totals.taxAmount + lineTax);
      totals.totalAmount = roundCurrency(totals.totalAmount + lineSubtotal + lineTax);

      return totals;
    },
    {
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0
    }
  );
}

function formatDateSegment(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

async function generatePurchaseOrderCode(session) {
  const prefix = `PO-${formatDateSegment()}-`;
  const regex = new RegExp(`^${prefix}`);
  const count = await PurchaseOrder.countDocuments({ code: regex }).session(session);
  const code = `${prefix}${String(count + 1).padStart(3, "0")}`;
  const exists = await PurchaseOrder.exists({ code }).session(session);

  if (!exists) {
    return code;
  }

  for (let index = count + 2; index < count + 50; index += 1) {
    const nextCode = `${prefix}${String(index).padStart(3, "0")}`;
    const duplicated = await PurchaseOrder.exists({ code: nextCode }).session(session);

    if (!duplicated) {
      return nextCode;
    }
  }

  throw createError(500, "Unable to generate purchase order code");
}

async function assertReferenceExists(Model, id, label, session) {
  const document = await Model.findById(id).session(session);

  if (!document) {
    throw createError(400, `${label} not found`);
  }
}

async function validatePurchaseOrderReferences(payload, session) {
  await Promise.all([
    assertReferenceExists(Supplier, payload.supplier, "supplier", session),
    assertReferenceExists(Warehouse, payload.warehouse, "warehouse", session)
  ]);

  const productIds = [...new Set((payload.items || []).map((item) => String(item.product)))];

  await Promise.all(productIds.map((productId) => assertReferenceExists(Product, productId, "product", session)));
}

async function getPurchaseOrderDocument(id, session = null) {
  const orderQuery = PurchaseOrder.findById(id).populate(purchaseOrderPopulate);
  const itemQuery = PurchaseOrderItem.find({ purchaseOrder: id }).populate(purchaseOrderItemPopulate).sort({ createdAt: 1 });

  if (session) {
    orderQuery.session(session);
    itemQuery.session(session);
  }

  const [order, items] = await Promise.all([orderQuery, itemQuery]);

  if (!order) {
    throw createError(404, "Purchase order not found");
  }

  return {
    ...order.toObject(),
    items
  };
}

async function replacePurchaseOrderItems(orderId, items, session) {
  await PurchaseOrderItem.deleteMany({ purchaseOrder: orderId }).session(session);

  const normalizedItems = items.map((item) => normalizeItem(item));

  await PurchaseOrderItem.insertMany(
    normalizedItems.map((item) => ({
      purchaseOrder: orderId,
      ...item
    })),
    { session }
  );

  return normalizedItems;
}

async function createPurchaseOrder(payload, user) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await validatePurchaseOrderReferences(payload, session);

    const normalizedItems = payload.items.map((item) => normalizeItem(item));
    const totals = calculateTotals(normalizedItems);
    const code = payload.code ? normalizeCode(payload.code) : await generatePurchaseOrderCode(session);

    const [order] = await PurchaseOrder.create(
      [
        cleanUndefined({
          code,
          supplier: payload.supplier,
          warehouse: payload.warehouse,
          orderedBy: user?._id,
          expectedDate: payload.expectedDate,
          note: payload.note,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount
        })
      ],
      { session }
    );

    await PurchaseOrderItem.insertMany(
      normalizedItems.map((item) => ({
        purchaseOrder: order._id,
        ...item
      })),
      { session }
    );

    const data = await getPurchaseOrderDocument(order._id, session);

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

async function listPurchaseOrders(filters = {}) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.supplier) {
    query.supplier = filters.supplier;
  }

  if (filters.warehouse) {
    query.warehouse = filters.warehouse;
  }

  if (filters.code) {
    query.code = { $regex: filters.code, $options: "i" };
  }

  const [orders, total] = await Promise.all([
    PurchaseOrder.find(query).populate(purchaseOrderPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PurchaseOrder.countDocuments(query)
  ]);

  return {
    message: "Purchase orders fetched successfully",
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function getPurchaseOrderById(id) {
  return getPurchaseOrderDocument(id);
}

async function updatePurchaseOrderById(id, payload) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await PurchaseOrder.findById(id).session(session);

    if (!order) {
      throw createError(404, "Purchase order not found");
    }

    if (order.status !== "draft") {
      throw createError(409, "Only draft purchase orders can be updated");
    }

    await validatePurchaseOrderReferences(payload, session);

    const normalizedItems = payload.items.map((item) => normalizeItem(item));
    const totals = calculateTotals(normalizedItems);

    Object.assign(
      order,
      cleanUndefined({
        code: payload.code ? normalizeCode(payload.code) : undefined,
        supplier: payload.supplier,
        warehouse: payload.warehouse,
        expectedDate: payload.expectedDate,
        note: payload.note,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount
      })
    );

    await order.save({ session });
    await replacePurchaseOrderItems(order._id, normalizedItems, session);

    const data = await getPurchaseOrderDocument(order._id, session);

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

async function submitPurchaseOrder(id) {
  const order = await PurchaseOrder.findById(id);

  if (!order) {
    throw createError(404, "Purchase order not found");
  }

  if (order.status !== "draft") {
    throw createError(409, "Only draft purchase orders can be submitted");
  }

  const itemCount = await PurchaseOrderItem.countDocuments({ purchaseOrder: order._id });

  if (!itemCount) {
    throw createError(409, "Purchase order must have at least one item before submit");
  }

  order.status = "pending";
  await order.save();

  return getPurchaseOrderDocument(order._id);
}

async function approvePurchaseOrder(id) {
  const order = await PurchaseOrder.findById(id);

  if (!order) {
    throw createError(404, "Purchase order not found");
  }

  if (order.status !== "pending") {
    throw createError(409, "Only pending purchase orders can be approved");
  }

  order.status = "approved";
  await order.save();

  return getPurchaseOrderDocument(order._id);
}

async function receivePurchaseOrder(id, user) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await PurchaseOrder.findById(id).session(session);

    if (!order) {
      throw createError(404, "Purchase order not found");
    }

    if (order.status !== "approved") {
      throw createError(409, "Only approved purchase orders can be received");
    }

    const items = await PurchaseOrderItem.find({ purchaseOrder: order._id }).session(session);

    if (!items.length) {
      throw createError(409, "Purchase order has no items to receive");
    }

    for (const item of items) {
      let inventory = await Inventory.findOne({
        product: item.product,
        warehouse: order.warehouse
      }).session(session);

      if (!inventory) {
        [inventory] = await Inventory.create(
          [
            {
              product: item.product,
              warehouse: order.warehouse
            }
          ],
          { session }
        );
      }

      inventory.quantityOnHand += Number(item.quantity);
      inventory.lastStockedAt = new Date();

      await inventory.save({ session });

      item.receivedQuantity = item.quantity;
      await item.save({ session });

      await InventoryTransaction.create(
        [
          {
            inventory: inventory._id,
            product: item.product,
            warehouse: order.warehouse,
            type: "import",
            quantity: Number(item.quantity),
            balanceAfter: inventory.quantityOnHand,
            referenceType: "purchase_order",
            referenceId: order._id,
            note: `Received from purchase order ${order.code}`,
            createdBy: user?._id
          }
        ],
        { session }
      );
    }

    order.status = "received";
    await order.save({ session });

    const data = await getPurchaseOrderDocument(order._id, session);

    await session.commitTransaction();

    return data;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

async function cancelPurchaseOrder(id) {
  const order = await PurchaseOrder.findById(id);

  if (!order) {
    throw createError(404, "Purchase order not found");
  }

  if (order.status === "received") {
    throw createError(409, "Received purchase orders cannot be cancelled");
  }

  if (order.status === "cancelled") {
    throw createError(409, "Purchase order has already been cancelled");
  }

  order.status = "cancelled";
  await order.save();

  return getPurchaseOrderDocument(order._id);
}

module.exports = {
  createPurchaseOrder,
  listPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderById,
  submitPurchaseOrder,
  approvePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder
};
