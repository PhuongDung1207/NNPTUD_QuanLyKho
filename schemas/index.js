const Address = require("./addresses");
const Permission = require("./permissions");
const Role = require("./roles");
const User = require("./users");
const Warehouse = require("./warehouses");
const Category = require("./categories");
const Brand = require("./brands");
const Supplier = require("./suppliers");
const Unit = require("./units");
const Tax = require("./taxes");
const Product = require("./products");
const ProductVariant = require("./productVariants");
const Inventory = require("./inventories");
const InventoryTransaction = require("./inventoryTransactions");
const PurchaseOrder = require("./purchaseOrders");
const PurchaseOrderItem = require("./purchaseOrderItems");
const StockAdjustment = require("./stockAdjustments");
const StockAdjustmentItem = require("./stockAdjustmentItems");
const TransferOrder = require("./transferOrders");
const TransferOrderItem = require("./transferOrderItems");
const Customer = require("./customers");
const SalesOrder = require("./salesOrders");
const SalesOrderItem = require("./salesOrderItems");
const BatchLot = require("./batchLots");
const AuditLog = require("./auditLogs");

module.exports = {
  Address,
  Permission,
  Role,
  User,
  Warehouse,
  Category,
  Brand,
  Supplier,
  Unit,
  Tax,
  Product,
  ProductVariant,
  Inventory,
  InventoryTransaction,
  PurchaseOrder,
  PurchaseOrderItem,
  StockAdjustment,
  StockAdjustmentItem,
  TransferOrder,
  TransferOrderItem,
  Customer,
  SalesOrder,
  SalesOrderItem,
  BatchLot,
  AuditLog
};
