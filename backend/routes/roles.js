const express = require("express");

const rolesController = require("../controllers/roles");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizeRoles } = require("../utils/authHandler");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const result = await rolesController.listRoles();

    res.json(result);
  })
);

module.exports = router;
