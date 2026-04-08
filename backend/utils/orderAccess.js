const createError = require("http-errors");

function getUserRoleName(user) {
  if (!user?.role) {
    return "";
  }

  if (typeof user.role === "object" && user.role !== null) {
    return String(user.role.name || user.role.code || "").toLowerCase();
  }

  return String(user.role || "").toLowerCase();
}

function isAdminUser(user) {
  return getUserRoleName(user) === "admin";
}

function assertAdminUser(user, message = "Only admin can perform this action") {
  if (!isAdminUser(user)) {
    throw createError(403, message);
  }
}

function assertAdminOrOwner(user, ownerId, message = "You do not have permission to perform this action") {
  if (isAdminUser(user)) {
    return;
  }

  if (!user?._id || !ownerId || String(user._id) !== String(ownerId)) {
    throw createError(403, message);
  }
}

module.exports = {
  getUserRoleName,
  isAdminUser,
  assertAdminUser,
  assertAdminOrOwner
};
