const { Role } = require("../schemas");

async function listRoles() {
  const roles = await Role.find()
    .sort({ name: 1 });

  return {
    message: "Roles fetched successfully",
    data: roles
  };
}

module.exports = {
  listRoles
};
