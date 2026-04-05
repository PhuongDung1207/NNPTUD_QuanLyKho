const express = require("express");

const rolesController = require("../controllers/roles");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizePermissions } = require("../utils/authHandler");
const { PERMISSION_CODES } = require("../utils/accessControlBootstrap");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  authorizePermissions(PERMISSION_CODES.ROLE_READ),
  asyncHandler(async (req, res) => {
    const result = await rolesController.listRoles();

    res.json(result);
  })
);

module.exports = router;
