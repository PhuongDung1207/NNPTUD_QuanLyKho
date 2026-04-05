const express = require("express");

const authController = require("../controllers/auth");
const usersController = require("../controllers/users");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizePermissions } = require("../utils/authHandler");
const { PERMISSION_CODES } = require("../utils/accessControlBootstrap");
const {
  loginRules,
  activationTokenQueryRules,
  activateAccountRules,
  validate
} = require("../utils/validator");

const router = express.Router();

router.post(
  "/login",
  loginRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await authController.login(req.body);

    res.cookie("accessToken", result.token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: "Login successful",
      data: result
    });
  })
);

router.get(
  "/activate-account",
  activationTokenQueryRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await authController.getActivationPreview(req.query.token);

    res.json({
      message: "Activation token is valid",
      data
    });
  })
);

router.post(
  "/activate-account",
  activateAccountRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await authController.activateAccount(req.body);

    res.json({
      message: "Account activated successfully",
      data
    });
  })
);

router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.json({
    message: "Logout successful"
  });
});

router.get(
  "/me",
  requireAuth,
  authorizePermissions(PERMISSION_CODES.USER_READ_SELF),
  asyncHandler(async (req, res) => {
    const data = await usersController.getCurrentUser(req.user._id);

    res.json({
      message: "Current user fetched successfully",
      data
    });
  })
);

module.exports = router;
