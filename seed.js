require('dotenv').config();
const mongoose = require('mongoose');
const { Category, Brand, Unit, Warehouse, Product, Inventory } = require('./schemas');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27011/quan-ly-kho');
  console.log('--- Seeding Data ---');

  // Clear existing if needed? No, let's just add new ones.

  const category = await Category.findOneAndUpdate(
    { name: 'Electronics' },
    { name: 'Electronics', code: 'ELEC', status: 'active' },
    { upsert: true, new: true }
  );
  console.log('Category seed:', category.name);

  const brand = await Brand.findOneAndUpdate(
    { name: 'Logitech' },
    { name: 'Logitech', code: 'LOGI', status: 'active' },
    { upsert: true, new: true }
  );
  console.log('Brand seed:', brand.name);

  const unit = await Unit.findOneAndUpdate(
    { symbol: 'pcs' },
    { name: 'Pieces', code: 'PCS', symbol: 'pcs', precision: 0, status: 'active' },
    { upsert: true, new: true }
  );
  console.log('Unit seed:', unit.name);

  const warehouse = await Warehouse.findOneAndUpdate(
    { name: 'Main Warehouse' },
    { name: 'Main Warehouse', code: 'WH01', status: 'active' },
    { upsert: true, new: true }
  );
  console.log('Warehouse seed:', warehouse.name);

  const product = await Product.findOneAndUpdate(
    { sku: 'MS-G502' },
    {
      name: 'Logitech G502 Mouse',
      sku: 'MS-G502',
      barcode: '1234567890123',
      category: category._id,
      brand: brand._id,
      uom: unit._id,
      status: 'active',
      price: {
        cost: 25.00,
        sale: 49.99,
        wholesale: 35.00
      }
    },
    { upsert: true, new: true }
  );
  console.log('Product seed:', product.name);

  // Initial Inventory
  await Inventory.findOneAndUpdate(
     { product: product._id, warehouse: warehouse._id },
     { product: product._id, warehouse: warehouse._id, quantity: 100, reorderPoint: 10 },
     { upsert: true, new: true }
  );
  console.log('Inventory seed for:', product.name);

  console.log('--- Seed Complete ---');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
