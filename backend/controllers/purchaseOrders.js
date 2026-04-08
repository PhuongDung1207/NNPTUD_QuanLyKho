const createError = require("http-errors");

const {
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  Warehouse,
  Product,
  BatchLot,
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

function removeUndefinedFields(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function getDuplicateKeyMessage(error) {
  const field = Object.keys(error.keyPattern || {})[0] || "field";
  return `${field} already exists`;
}

function formatMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function formatPurchaseOrderCode(code) {
  return String(code || "").trim().toUpperCase();
}

function buildPurchaseOrderItemPayload(item) {
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);
  const taxRate = Number(item.taxRate || 0);
  const subtotal = formatMoney(quantity * unitPrice);
  const taxAmount = formatMoney((subtotal * taxRate) / 100);

  return {
    product: item.product,
    quantity,
    receivedQuantity: Number(item.receivedQuantity || 0),
    unitPrice,
    taxRate,
    lineTotal: formatMoney(subtotal + taxAmount)
  };
}

function calculatePurchaseOrderTotals(items) {
  return items.reduce(
    (totals, item) => {
      const lineSubtotal = formatMoney(Number(item.quantity) * Number(item.unitPrice));
      const lineTax = formatMoney((lineSubtotal * Number(item.taxRate || 0)) / 100);

      totals.subtotal = formatMoney(totals.subtotal + lineSubtotal);
      totals.taxAmount = formatMoney(totals.taxAmount + lineTax);
      totals.totalAmount = formatMoney(totals.totalAmount + lineSubtotal + lineTax);

      return totals;
    },
    { subtotal: 0, taxAmount: 0, totalAmount: 0 }
  );
}

function getDateCodeSegment(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function normalizeBatchLotCode(lotCode) {
  return String(lotCode || "").trim().toUpperCase();
}

function isExpiredByDate(expiryDate) {
  return Boolean(expiryDate) && new Date(expiryDate).getTime() < Date.now();
}

function ensureManufactureDateBeforeExpiry(manufactureDate, expiryDate) {
  if (manufactureDate && expiryDate && new Date(manufactureDate) > new Date(expiryDate)) {
    throw createError(400, "manufactureDate must be before or equal to expiryDate");
  }
}

async function generatePurchaseOrderCode() {
  const prefix = `PO-${getDateCodeSegment()}-`;
  const regex = new RegExp(`^${prefix}`);
  const count = await PurchaseOrder.countDocuments({ code: regex });
  const code = `${prefix}${String(count + 1).padStart(3, "0")}`;
  const exists = await PurchaseOrder.exists({ code });

  if (!exists) {
    return code;
  }

  for (let index = count + 2; index < count + 50; index += 1) {
    const nextCode = `${prefix}${String(index).padStart(3, "0")}`;
    const duplicated = await PurchaseOrder.exists({ code: nextCode });

    if (!duplicated) {
      return nextCode;
    }
  }

  throw createError(500, "Unable to generate purchase order code");
}

async function ensureReferenceExists(Model, id, label) {
  const document = await Model.findById(id);

  if (!document) {
    throw createError(400, `${label} not found`);
  }
}

async function validatePurchaseOrderPayloadReferences(payload) {
  await Promise.all([
    ensureReferenceExists(Supplier, payload.supplier, "supplier"),
    ensureReferenceExists(Warehouse, payload.warehouse, "warehouse")
  ]);

  const productIds = [...new Set((payload.items || []).map((item) => String(item.product)))];
  await Promise.all(productIds.map((productId) => ensureReferenceExists(Product, productId, "product")));
}

function getDocumentId(documentOrId) {
  return documentOrId?._id || documentOrId;
}

function buildReceivePayloadMap(items = []) {
  return new Map(items.map((item) => [String(item.purchaseOrderItemId), item]));
}

function sumBatchLotQuantities(batchLots = []) {
  return batchLots.reduce((total, batchLot) => total + Number(batchLot.quantity || 0), 0);
}

function validateBatchLotsAgainstReceivedQuantity(batchLots = [], expectedQuantity) {
  const totalBatchLotQuantity = sumBatchLotQuantities(batchLots);

  if (totalBatchLotQuantity !== Number(expectedQuantity)) {
    throw createError(409, "Total batchLots quantity must equal received quantity");
  }

  const lotCodes = batchLots.map((batchLot) => normalizeBatchLotCode(batchLot.lotCode));
  const uniqueLotCodes = new Set(lotCodes);

  if (uniqueLotCodes.size !== lotCodes.length) {
    throw createError(409, "Batch lot codes must not be duplicated in the same item");
  }

  for (const batchLot of batchLots) {
    ensureManufactureDateBeforeExpiry(batchLot.manufactureDate, batchLot.expiryDate);
  }
}

function ensureTrackedProductsHaveBatchLots(orderItem, receiveItemPayload, expectedQuantity) {
  const trackingType = orderItem.product?.tracking;
  const batchLots = receiveItemPayload?.batchLots || [];

  if (trackingType === "lot" && !batchLots.length) {
    throw createError(409, "batchLots are required for products tracked by lot");
  }

  if (batchLots.length) {
    validateBatchLotsAgainstReceivedQuantity(batchLots, expectedQuantity);
  }
}

async function getPurchaseOrderDetail(id) {
  const [order, items] = await Promise.all([
    PurchaseOrder.findById(id).populate(purchaseOrderPopulate),
    PurchaseOrderItem.find({ purchaseOrder: id }).populate(purchaseOrderItemPopulate).sort({ createdAt: 1 })
  ]);

  if (!order) {
    throw createError(404, "Purchase order not found");
  }

  return {
    ...order.toObject(),
    items: items.map((item) => {
      const itemObject = item.toObject();
      return {
        ...itemObject,
        remainingQuantity: Math.max(Number(itemObject.quantity) - Number(itemObject.receivedQuantity || 0), 0)
      };
    })
  };
}

async function replacePurchaseOrderItems(orderId, items) {
  await PurchaseOrderItem.deleteMany({ purchaseOrder: orderId });

  const normalizedItems = items.map((item) => buildPurchaseOrderItemPayload(item));

  await PurchaseOrderItem.insertMany(
    normalizedItems.map((item) => ({
      purchaseOrder: orderId,
      ...item
    }))
  );

  return normalizedItems;
}

async function createPurchaseOrder(payload, user) {
  try {
    await validatePurchaseOrderPayloadReferences(payload);

    const normalizedItems = payload.items.map((item) => buildPurchaseOrderItemPayload(item));
    const totals = calculatePurchaseOrderTotals(normalizedItems);
    const code = payload.code ? formatPurchaseOrderCode(payload.code) : await generatePurchaseOrderCode();

    const order = await PurchaseOrder.create(
      removeUndefinedFields({
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
    );

    await PurchaseOrderItem.insertMany(
      normalizedItems.map((item) => ({
        purchaseOrder: order._id,
        ...item
      }))
    );

    return getPurchaseOrderDetail(order._id);
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, getDuplicateKeyMessage(error));
    }
    throw error;
  }
}

async function listPurchaseOrders(filters = {}) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.supplier) query.supplier = filters.supplier;
  if (filters.warehouse) query.warehouse = filters.warehouse;
  if (filters.code) query.code = { $regex: filters.code, $options: "i" };

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
  return getPurchaseOrderDetail(id);
}

async function updatePurchaseOrderById(id, payload) {
  try {
    const order = await PurchaseOrder.findById(id);

    if (!order) {
      throw createError(404, "Purchase order not found");
    }

    if (order.status !== "draft") {
      throw createError(409, "Only draft purchase orders can be updated");
    }

    await validatePurchaseOrderPayloadReferences(payload);

    const normalizedItems = payload.items.map((item) => buildPurchaseOrderItemPayload(item));
    const totals = calculatePurchaseOrderTotals(normalizedItems);

    Object.assign(
      order,
      removeUndefinedFields({
        code: payload.code ? formatPurchaseOrderCode(payload.code) : undefined,
        supplier: payload.supplier,
        warehouse: payload.warehouse,
        expectedDate: payload.expectedDate,
        note: payload.note,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount
      })
    );

    await order.save();
    await replacePurchaseOrderItems(order._id, normalizedItems);

    return getPurchaseOrderDetail(order._id);
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, getDuplicateKeyMessage(error));
    }
    throw error;
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

  return getPurchaseOrderDetail(order._id);
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

  return getPurchaseOrderDetail(order._id);
}

async function applyInventoryReceipt({ order, item, quantityToReceive, note, user }) {
  let inventory = await Inventory.findOne({
    product: item.product,
    warehouse: order.warehouse
  });

  if (!inventory) {
    inventory = await Inventory.create({
      product: item.product,
      warehouse: order.warehouse
    });
  }

  inventory.quantityOnHand += Number(quantityToReceive);
  inventory.lastStockedAt = new Date();
  await inventory.save();

  item.receivedQuantity = Number(item.receivedQuantity || 0) + Number(quantityToReceive);
  await item.save();

  await InventoryTransaction.create({
    inventory: inventory._id,
    product: item.product,
    warehouse: order.warehouse,
    type: "import",
    quantity: Number(quantityToReceive),
    balanceAfter: inventory.quantityOnHand,
    referenceType: "purchase_order",
    referenceId: order._id,
    note: note || `Received from purchase order ${order.code}`,
    createdBy: user?._id
  });
}

async function createBatchLotsForReceivedItem({ order, item, batchLots }) {
  if (!batchLots?.length) {
    return;
  }

  await BatchLot.insertMany(
    batchLots.map((batchLot) => ({
      product: getDocumentId(item.product),
      warehouse: order.warehouse,
      lotCode: normalizeBatchLotCode(batchLot.lotCode),
      manufactureDate: batchLot.manufactureDate,
      expiryDate: batchLot.expiryDate,
      quantity: Number(batchLot.quantity),
      status: isExpiredByDate(batchLot.expiryDate) ? "expired" : "available"
    }))
  );
}

async function validateReceiveItemsBelongToOrder(orderId) {
  return PurchaseOrderItem.find({ purchaseOrder: orderId }).populate("product", "tracking");
}

async function receivePurchaseOrderPartially(id, payload, user) {
  try {
    const order = await PurchaseOrder.findById(id);

    if (!order) {
      throw createError(404, "Purchase order not found");
    }

    if (order.status !== "approved") {
      throw createError(409, "Only approved purchase orders can be partially received");
    }

    const items = await validateReceiveItemsBelongToOrder(order._id);

    if (!items.length) {
      throw createError(409, "Purchase order has no items to receive");
    }

    const itemMap = new Map(items.map((item) => [String(item._id), item]));
    const receiveItemPayloadMap = buildReceivePayloadMap(payload.items);

    for (const receivedItem of payload.items) {
      const orderItem = itemMap.get(String(receivedItem.purchaseOrderItemId));

      if (!orderItem) {
        throw createError(400, "purchaseOrderItemId does not belong to this purchase order");
      }

      const quantityToReceive = Number(receivedItem.receivedQuantity);
      const remainingQuantity = Number(orderItem.quantity) - Number(orderItem.receivedQuantity || 0);

      if (quantityToReceive > remainingQuantity) {
        throw createError(409, "receivedQuantity exceeds remaining quantity");
      }

      ensureTrackedProductsHaveBatchLots(orderItem, receivedItem, quantityToReceive);

      await applyInventoryReceipt({
        order,
        item: orderItem,
        quantityToReceive,
        note: payload.note,
        user
      });

      await createBatchLotsForReceivedItem({
        order,
        item: orderItem,
        batchLots: receiveItemPayloadMap.get(String(orderItem._id))?.batchLots
      });
    }

    const refreshedItems = await PurchaseOrderItem.find({ purchaseOrder: order._id });
    const isFullyReceived = refreshedItems.every(
      (item) => Number(item.receivedQuantity || 0) >= Number(item.quantity)
    );

    if (isFullyReceived) {
      order.status = "received";
      await order.save();
    }

    return getPurchaseOrderDetail(order._id);
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, getDuplicateKeyMessage(error));
    }
    throw error;
  }
}

async function receivePurchaseOrder(id, payload, user) {
  try {
    const order = await PurchaseOrder.findById(id);

    if (!order) {
      throw createError(404, "Purchase order not found");
    }

    if (order.status !== "approved") {
      throw createError(409, "Only approved purchase orders can be received");
    }

    const items = await validateReceiveItemsBelongToOrder(order._id);

    if (!items.length) {
      throw createError(409, "Purchase order has no items to receive");
    }

    const receiveItemPayloadMap = buildReceivePayloadMap(payload?.items || []);

    for (const item of items) {
      const remainingQuantity = Number(item.quantity) - Number(item.receivedQuantity || 0);

      if (remainingQuantity <= 0) {
        continue;
      }

      const receiveItemPayload = receiveItemPayloadMap.get(String(item._id));
      ensureTrackedProductsHaveBatchLots(item, receiveItemPayload, remainingQuantity);

      await applyInventoryReceipt({
        order,
        item,
        quantityToReceive: remainingQuantity,
        note: payload?.note,
        user
      });

      await createBatchLotsForReceivedItem({
        order,
        item,
        batchLots: receiveItemPayload?.batchLots
      });
    }

    order.status = "received";
    await order.save();

    return getPurchaseOrderDetail(order._id);
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, getDuplicateKeyMessage(error));
    }
    throw error;
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

  return getPurchaseOrderDetail(order._id);
}

module.exports = {
  createPurchaseOrder,
  listPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderById,
  submitPurchaseOrder,
  approvePurchaseOrder,
  receivePurchaseOrderPartially,
  receivePurchaseOrder,
  cancelPurchaseOrder
};
