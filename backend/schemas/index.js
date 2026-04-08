const Permission = require("./permissions");
const Role = require("./roles");
const User = require("./users");
const Warehouse = require("./warehouses");
const Category = require("./categories");
const Brand = require("./brands");
const Supplier = require("./suppliers");
const Unit = require("./units");
const Product = require("./products");
const ProductVariant = require("./productVariants");
const Inventory = require("./inventories");
const InventoryTransaction = require("./inventoryTransactions");
const PurchaseOrder = require("./purchaseOrders");
const PurchaseOrderItem = require("./purchaseOrderItems");
const TransferOrder = require("./transferOrders");
const TransferOrderItem = require("./transferOrderItems");
const BatchLot = require("./batchLots");
const AuditLog = require("./auditLogs");
const OutboundOrder = require("./outboundOrders");
const OutboundOrderItem = require("./outboundOrderItems");

module.exports = {
  Permission,
  Role,
  User,
  Warehouse,
  Category,
  Brand,
  Supplier,
  Unit,
  Product,
  ProductVariant,
  Inventory,
  InventoryTransaction,
  PurchaseOrder,
  PurchaseOrderItem,
  TransferOrder,
  TransferOrderItem,
  BatchLot,
  AuditLog,
  OutboundOrder,
  OutboundOrderItem
};
