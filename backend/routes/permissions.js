const express = require("express");

const permissionsController = require("../controllers/permissions");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizePermissions } = require("../utils/authHandler");
const { PERMISSION_CODES } = require("../utils/accessControlBootstrap");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  authorizePermissions(PERMISSION_CODES.PERMISSION_READ),
  asyncHandler(async (req, res) => {
    const result = await permissionsController.listPermissions();

    res.json(result);
  })
);

module.exports = router;
