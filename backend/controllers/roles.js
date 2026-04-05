const { Role } = require("../schemas");

async function listRoles() {
  const roles = await Role.find()
    .populate("permissions", "name code module action description")
    .sort({ name: 1 });

  return {
    message: "Roles fetched successfully",
    data: roles
  };
}

module.exports = {
  listRoles
};
