const { Warehouse } = require("../schemas");

async function listWarehouses() {
  const warehouses = await Warehouse.find({ status: "active" }).sort({ name: 1 });
  return { data: warehouses };
}

module.exports = { listWarehouses };
