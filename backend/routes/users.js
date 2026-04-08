const express = require("express");

const usersController = require("../controllers/users");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, authorizeRoles } = require("../utils/authHandler");
const { resolveAppBaseUrl } = require("../utils/accountActivation");
const { uploadSingle } = require("../utils/uploadHandler");
const {
  validate,
  mongoIdParamRule,
  userListRules,
  userCreateRules,
  userUpdateRules,
  userSelfUpdateRules
} = require("../utils/validator");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const data = await usersController.getCurrentUser(req.user._id);

    res.json({
      message: "Current user fetched successfully",
      data
    });
  })
);

router.patch(
  "/me",
  userSelfUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await usersController.updateCurrentUser(req.user._id, req.body);

    res.json({
      message: "Current user updated successfully",
      data
    });
  })
);

router.get(
  "/",
  userListRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await usersController.listUsers(req.query);

    res.json(result);
  })
);

router.get(
  "/:id",
  authorizeRoles("admin"),
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await usersController.getUserById(req.params.id);

    res.json({
      message: "User fetched successfully",
      data
    });
  })
);

router.post(
  "/",
  authorizeRoles("admin"),
  userCreateRules,
  validate,
  asyncHandler(async (req, res) => {
    const data = await usersController.createUser(req.body, {
      appBaseUrl: resolveAppBaseUrl(req)
    });

    res.status(201).json({
      message: "User created successfully. Activation email has been sent.",
      data
    });
  })
);

router.post(
  "/import",
  authorizeRoles("admin"),
  uploadSingle("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "Excel file is required"
      });
    }

    const fileName = String(req.file.originalname || "").toLowerCase();

    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return res.status(400).json({
        message: "Only .xlsx or .xls files are supported"
      });
    }

    const data = await usersController.importUsersFromWorkbook(req.file.buffer, {
      appBaseUrl: resolveAppBaseUrl(req)
    });
    const summary = data.summary || {};
    const message = summary.createdCount > 0
      ? `Imported ${summary.createdCount}/${summary.totalRows} user(s). Activation emails have been sent for successful rows.`
      : "No users were imported. Please review the failed rows and try again.";
    const statusCode = summary.createdCount > 0 ? 201 : 200;

    res.status(statusCode).json({
      message,
      data
    });
  })
);

router.patch(
  "/:id",
  authorizeRoles("admin"),
  mongoIdParamRule("id"),
  userUpdateRules,
  validate,
  asyncHandler(async (req, res) => {
    const result = await usersController.updateUserById(req.params.id, req.body, req.user._id, {
      appBaseUrl: resolveAppBaseUrl(req)
    });

    res.json({
      message: result.activationEmailSent
        ? "User updated successfully. Activation email has been sent to the new address."
        : "User updated successfully",
      data: result.user
    });
  })
);

router.post(
  "/:id/resend-invite",
  authorizeRoles("admin"),
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await usersController.resendActivationInviteById(req.params.id, {
      appBaseUrl: resolveAppBaseUrl(req)
    });

    res.json({
      message: "Activation email resent successfully",
      data
    });
  })
);

router.patch(
  "/:id/lock",
  authorizeRoles("admin"),
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await usersController.lockUserById(req.params.id, req.user._id);

    res.json({
      message: "User locked successfully",
      data
    });
  })
);

router.patch(
  "/:id/unlock",
  authorizeRoles("admin"),
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    const data = await usersController.unlockUserById(req.params.id);

    res.json({
      message: "User unlocked successfully",
      data
    });
  })
);

router.delete(
  "/:id",
  authorizeRoles("admin"),
  mongoIdParamRule("id"),
  validate,
  asyncHandler(async (req, res) => {
    await usersController.deleteUserById(req.params.id, req.user._id);

    res.json({
      message: "User deleted successfully"
    });
  })
);

module.exports = router;
