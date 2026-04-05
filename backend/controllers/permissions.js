const { Permission } = require("../schemas");

async function listPermissions() {
  const permissions = await Permission.find().sort({ module: 1, action: 1, code: 1 });

  return {
    message: "Permissions fetched successfully",
    data: permissions
  };
}

module.exports = {
  listPermissions
};
