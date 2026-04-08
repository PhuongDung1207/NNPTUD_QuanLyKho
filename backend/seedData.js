require("dotenv").config();
const mongoose = require("mongoose");

// Require schemas
const Brand = require("./schemas/brands");
const Category = require("./schemas/categories");
const Unit = require("./schemas/units");
const Supplier = require("./schemas/suppliers");
const Warehouse = require("./schemas/warehouses");
const Product = require("./schemas/products");

async function seedData() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/warehouse";
    console.log(`Kết nối MongoDB tại: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("Kết nối thành công MongoDB!");

    // Tuỳ chọn: Xoá dữ liệu cũ trước khi seed
    // Lưu ý: Nếu không muốn xoá, bạn có thể comment các dòng xoá này lại.
    console.log("Đang xoá dữ liệu cũ (chỉ dành cho test)...");
    await Promise.all([
      Product.deleteMany({}),
      Brand.deleteMany({}),
      Category.deleteMany({}),
      Unit.deleteMany({}),
      Supplier.deleteMany({}),
      Warehouse.deleteMany({})
    ]);

    // 1. Seed Brands
    console.log("Đang tạo danh mục Brands (Thương hiệu)...");
    const brands = await Brand.insertMany([
      { name: "Apple", code: "APP", description: "Công ty công nghệ Mỹ" },
      { name: "Samsung", code: "SAM", description: "Tập đoàn công nghệ Hàn Quốc" },
      { name: "Sony", code: "SON", description: "Tập đoàn đa quốc gia Nhật Bản" }
    ]);

    // 2. Seed Categories
    console.log("Đang tạo danh mục Categories (Danh mục sản phẩm)...");
    const categories = await Category.insertMany([
      { name: "Điện thoại", code: "DT", description: "Thiết bị di động thông minh" },
      { name: "Laptop", code: "LT", description: "Máy tính xách tay" },
      { name: "Phụ kiện", code: "PK", description: "Phụ kiện điện tử" }
    ]);

    // 3. Seed Units
    console.log("Đang tạo danh mục Units (Đơn vị tính)...");
    const units = await Unit.insertMany([
      { name: "Cái", code: "CAI", symbol: "c", precision: 0 },
      { name: "Chiếc", code: "CHIEC", symbol: "ch", precision: 0 },
      { name: "Hộp", code: "HOP", symbol: "h", precision: 0 },
      { name: "Kilogram", code: "KG", symbol: "kg", precision: 2 }
    ]);

    // 4. Seed Suppliers
    console.log("Đang tạo danh mục Suppliers (Nhà cung cấp)...");
    const suppliers = await Supplier.insertMany([
      { 
        name: "Công ty TNHH Nhập Khẩu A", 
        code: "NCCA", 
        contactName: "Nguyễn Văn A", 
        phone: "0901234567", 
        email: "nguyenvana@ncca.com", 
        taxCode: "123456789" 
      },
      { 
        name: "Nhà Phân Phối B", 
        code: "NPPB", 
        contactName: "Trần Thị B", 
        phone: "0987654321", 
        email: "tranthib@nppb.com", 
        taxCode: "987654321" 
      }
    ]);

    // 5. Seed Warehouses
    console.log("Đang tạo danh mục Warehouses (Kho hàng)...");
    const warehouses = await Warehouse.insertMany([
      { 
        code: "KHO1", 
        name: "Kho Tổng TP.HCM", 
        description: "Kho hàng chính phân phối khu vực Miền Nam", 
        contactPhone: "0283111222", 
        contactEmail: "khotam@congty.com" 
      },
      { 
        code: "KHO2", 
        name: "Kho Trung Chuyển Hà Nội", 
        description: "Kho lưu tạm thời phân phối khu vực Miền Bắc", 
        contactPhone: "0243444555", 
        contactEmail: "kho.hn@congty.com" 
      }
    ]);

    // 6. Seed Products
    console.log("Đang tạo Product mẫu...");
    await Product.insertMany([
      {
        sku: "IP14-PRO-128",
        barcode: "1234500001",
        name: "iPhone 14 Pro 128GB",
        category: categories[0]._id, // Điện thoại
        brand: brands[0]._id,        // Apple
        supplier: suppliers[0]._id,  // NCCA
        uom: units[1]._id,           // Chiếc
        price: { cost: 20000000, sale: 25000000, wholesale: 22000000 },
        dimensions: { weight: 0.2, length: 14, width: 7, height: 0.8 },
        tracking: "serial",
        status: "active"
      },
      {
        sku: "SS-S23-ULTRA-256",
        barcode: "1234500002",
        name: "Samsung Galaxy S23 Ultra 256GB",
        category: categories[0]._id, // Điện thoại
        brand: brands[1]._id,        // Samsung
        supplier: suppliers[1]._id,  // NPPB
        uom: units[1]._id,           // Chiếc
        price: { cost: 18000000, sale: 23000000, wholesale: 20000000 },
        dimensions: { weight: 0.23, length: 16, width: 8, height: 0.9 },
        tracking: "serial",
        status: "active"
      },
      {
        sku: "MAC-AIR-M2",
        barcode: "1234500003",
        name: "Macbook Air M2 256GB",
        category: categories[1]._id, // Laptop
        brand: brands[0]._id,        // Apple
        supplier: suppliers[0]._id,  // NCCA
        uom: units[0]._id,           // Cái
        price: { cost: 25000000, sale: 28000000, wholesale: 26500000 },
        dimensions: { weight: 1.2, length: 30, width: 21, height: 1.1 },
        tracking: "serial",
        status: "active"
      }
    ]);

    console.log("Tạo dữ liệu mẫu thành công!");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi tạo dữ liệu mẫu:", error);
    process.exit(1);
  }
}

seedData();
