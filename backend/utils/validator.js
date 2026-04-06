const { body, param, query, validationResult } = require("express-validator");

const commonStatuses = ["active", "inactive"];
const productStatuses = ["draft", "active", "inactive", "discontinued"];
const userStatuses = ["active", "inactive", "locked"];
const purchaseOrderStatuses = ["draft", "pending", "approved", "received", "cancelled"];
const batchLotStatuses = ["available", "blocked", "expired"];
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;

function passwordComplexityRule(field, options = {}) {
  const isOptional = options.optional === true;
  let chain = body(field);

  if (isOptional) {
    chain = chain.optional();
  } else {
    chain = chain.notEmpty().withMessage(`${field} is required`).bail();
  }

  return chain
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(
      `${field} must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`
    )
    .bail()
    .matches(/[A-Z]/)
    .withMessage(`${field} must contain at least 1 uppercase letter`)
    .bail()
    .matches(/[a-z]/)
    .withMessage(`${field} must contain at least 1 lowercase letter`)
    .bail()
    .matches(/[0-9]/)
    .withMessage(`${field} must contain at least 1 number`)
    .bail()
    .matches(/[^A-Za-z0-9]/)
    .withMessage(`${field} must contain at least 1 special character`)
    .bail()
    .matches(/^\S+$/)
    .withMessage(`${field} cannot contain spaces`);
}

const transferOrderStatuses = ["draft", "pending", "in_transit", "completed", "cancelled"];

function isUploadOrHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.startsWith("/uploads/")) {
    return true;
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch (error) {
    return false;
  }
}

function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(422).json({
    message: "Validation failed",
    errors: result.array().map((issue) => ({
      [issue.path || issue.param]: issue.msg
    }))
  });
}

function mongoIdParamRule(field) {
  return param(field).isMongoId().withMessage(`${field} must be a valid MongoDB ObjectId`);
}

const productListRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("category").optional().isMongoId().withMessage("category must be a valid ObjectId"),
  query("brand").optional().isMongoId().withMessage("brand must be a valid ObjectId"),
  query("supplier").optional().isMongoId().withMessage("supplier must be a valid ObjectId"),
  query("warehouse").optional().isMongoId().withMessage("warehouse must be a valid ObjectId"),
  query("status").optional().isIn(productStatuses).withMessage(`status must be one of: ${productStatuses.join(", ")}`),
  query("lowStock").optional().isBoolean().withMessage("lowStock must be true or false")
];

const productCreateRules = [
  body("sku").trim().notEmpty().withMessage("sku is required").isLength({ max: 64 }).withMessage("sku must be at most 64 characters"),
  body("name").trim().notEmpty().withMessage("name is required").isLength({ max: 160 }).withMessage("name must be at most 160 characters"),
  body("warehouse").notEmpty().withMessage("warehouse is required").isMongoId().withMessage("warehouse must be a valid ObjectId"),
  body("barcode").optional({ values: "falsy" }).trim().isLength({ max: 64 }).withMessage("barcode must be at most 64 characters"),
  body("category").optional({ values: "falsy" }).isMongoId().withMessage("category must be a valid ObjectId"),
  body("brand").optional({ values: "falsy" }).isMongoId().withMessage("brand must be a valid ObjectId"),
  body("supplier").optional({ values: "falsy" }).isMongoId().withMessage("supplier must be a valid ObjectId"),
  body("uom").optional({ values: "falsy" }).isMongoId().withMessage("uom must be a valid ObjectId"),
  body("description").optional({ values: "falsy" }).isLength({ max: 3000 }).withMessage("description must be at most 3000 characters"),
  body("status").optional().isIn(productStatuses).withMessage(`status must be one of: ${productStatuses.join(", ")}`),
  body("tracking").optional().isIn(["none", "lot", "serial"]).withMessage("tracking must be one of: none, lot, serial"),
  body("price.cost").optional().isFloat({ min: 0 }).withMessage("price.cost must be a non-negative number"),
  body("price.sale").optional().isFloat({ min: 0 }).withMessage("price.sale must be a non-negative number"),
  body("price.wholesale").optional().isFloat({ min: 0 }).withMessage("price.wholesale must be a non-negative number"),
  body("dimensions.weight").optional().isFloat({ min: 0 }).withMessage("dimensions.weight must be a non-negative number"),
  body("dimensions.length").optional().isFloat({ min: 0 }).withMessage("dimensions.length must be a non-negative number"),
  body("dimensions.width").optional().isFloat({ min: 0 }).withMessage("dimensions.width must be a non-negative number"),
  body("dimensions.height").optional().isFloat({ min: 0 }).withMessage("dimensions.height must be a non-negative number"),
  body("initialQuantity").optional().isFloat({ min: 0 }).withMessage("initialQuantity must be a non-negative number"),
  body("reservedQuantity").optional().isFloat({ min: 0 }).withMessage("reservedQuantity must be a non-negative number"),
  body("reorderPoint").optional().isFloat({ min: 0 }).withMessage("reorderPoint must be a non-negative number"),
  body("minStockLevel").optional().isFloat({ min: 0 }).withMessage("minStockLevel must be a non-negative number"),
  body("maxStockLevel").optional().isFloat({ min: 0 }).withMessage("maxStockLevel must be a non-negative number"),
  body("imageUrls").optional().isArray().withMessage("imageUrls must be an array"),
  body("imageUrls.*")
    .optional()
    .custom((value) => isUploadOrHttpUrl(value))
    .withMessage("each imageUrls item must be a valid URL or /uploads path"),
  body("tags").optional().isArray().withMessage("tags must be an array"),
  body("tags.*").optional().isString().withMessage("each tag must be a string")
];

const productUpdateRules = [
  body("sku").optional().trim().notEmpty().withMessage("sku cannot be empty").isLength({ max: 64 }).withMessage("sku must be at most 64 characters"),
  body("name").optional().trim().notEmpty().withMessage("name cannot be empty").isLength({ max: 160 }).withMessage("name must be at most 160 characters"),
  body("warehouse").optional().isMongoId().withMessage("warehouse must be a valid ObjectId"),
  body("barcode").optional({ values: "falsy" }).trim().isLength({ max: 64 }).withMessage("barcode must be at most 64 characters"),
  body("category").optional({ values: "falsy" }).isMongoId().withMessage("category must be a valid ObjectId"),
  body("brand").optional({ values: "falsy" }).isMongoId().withMessage("brand must be a valid ObjectId"),
  body("supplier").optional({ values: "falsy" }).isMongoId().withMessage("supplier must be a valid ObjectId"),
  body("uom").optional({ values: "falsy" }).isMongoId().withMessage("uom must be a valid ObjectId"),
  body("description").optional({ values: "falsy" }).isLength({ max: 3000 }).withMessage("description must be at most 3000 characters"),
  body("status").optional().isIn(productStatuses).withMessage(`status must be one of: ${productStatuses.join(", ")}`),
  body("tracking").optional().isIn(["none", "lot", "serial"]).withMessage("tracking must be one of: none, lot, serial"),
  body("price.cost").optional().isFloat({ min: 0 }).withMessage("price.cost must be a non-negative number"),
  body("price.sale").optional().isFloat({ min: 0 }).withMessage("price.sale must be a non-negative number"),
  body("price.wholesale").optional().isFloat({ min: 0 }).withMessage("price.wholesale must be a non-negative number"),
  body("dimensions.weight").optional().isFloat({ min: 0 }).withMessage("dimensions.weight must be a non-negative number"),
  body("dimensions.length").optional().isFloat({ min: 0 }).withMessage("dimensions.length must be a non-negative number"),
  body("dimensions.width").optional().isFloat({ min: 0 }).withMessage("dimensions.width must be a non-negative number"),
  body("dimensions.height").optional().isFloat({ min: 0 }).withMessage("dimensions.height must be a non-negative number"),
  body("reorderPoint").optional().isFloat({ min: 0 }).withMessage("reorderPoint must be a non-negative number"),
  body("minStockLevel").optional().isFloat({ min: 0 }).withMessage("minStockLevel must be a non-negative number"),
  body("maxStockLevel").optional().isFloat({ min: 0 }).withMessage("maxStockLevel must be a non-negative number"),
  body("imageUrls").optional().isArray().withMessage("imageUrls must be an array"),
  body("imageUrls.*")
    .optional()
    .custom((value) => isUploadOrHttpUrl(value))
    .withMessage("each imageUrls item must be a valid URL or /uploads path"),
  body("tags").optional().isArray().withMessage("tags must be an array"),
  body("tags.*").optional().isString().withMessage("each tag must be a string")
];

const loginRules = [
  body("username").trim().notEmpty().withMessage("username is required").isLength({ max: 160 }).withMessage("username must be at most 160 characters"),
  body("password").notEmpty().withMessage("password is required").isLength({ min: 8 }).withMessage("password must be at least 8 characters")
];

const activationTokenQueryRules = [
  query("token").trim().notEmpty().withMessage("token is required")
];

const activateAccountRules = [
  body("token").trim().notEmpty().withMessage("token is required"),
  passwordComplexityRule("password")
];

const userListRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("status").optional().isIn(userStatuses).withMessage(`status must be one of: ${userStatuses.join(", ")}`),
  query("role").optional().trim().notEmpty().withMessage("role cannot be empty")
];

const userCreateRules = [
  body("username").trim().notEmpty().withMessage("username is required").isLength({ max: 60 }).withMessage("username must be at most 60 characters"),
  body("password").custom((value) => {
    if (value !== undefined) {
      throw new Error("password is set by the user during account activation");
    }

    return true;
  }),
  body("fullName").trim().notEmpty().withMessage("fullName is required").isLength({ max: 160 }).withMessage("fullName must be at most 160 characters"),
  body("status").custom((value) => {
    if (value !== undefined) {
      throw new Error("status is managed by the activation flow");
    }

    return true;
  }),
  body("role").trim().notEmpty().withMessage("role is required"),
  body("email").trim().notEmpty().withMessage("email is required").isEmail().withMessage("email must be valid").isLength({ max: 160 }).withMessage("email must be at most 160 characters"),
  body("phone").optional({ values: "falsy" }).trim().isLength({ max: 20 }).withMessage("phone must be at most 20 characters"),
  body("avatarUrl").optional({ values: "falsy" }).isURL().withMessage("avatarUrl must be a valid URL")
];

const userUpdateRules = [
  body("username").custom((value) => {
    if (value !== undefined) {
      throw new Error("username cannot be updated");
    }

    return true;
  }),
  passwordComplexityRule("password", { optional: true }),
  body("fullName").optional().trim().notEmpty().withMessage("fullName cannot be empty").isLength({ max: 160 }).withMessage("fullName must be at most 160 characters"),
  body("status").optional().isIn(userStatuses).withMessage(`status must be one of: ${userStatuses.join(", ")}`),
  body("role").optional().trim().notEmpty().withMessage("role cannot be empty"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("email must be valid").isLength({ max: 160 }).withMessage("email must be at most 160 characters"),
  body("phone").optional({ values: "falsy" }).trim().isLength({ max: 20 }).withMessage("phone must be at most 20 characters"),
  body("avatarUrl").optional({ values: "falsy" }).isURL().withMessage("avatarUrl must be a valid URL")
];

const userSelfUpdateRules = [
  body("username").custom((value) => {
    if (value !== undefined) {
      throw new Error("username cannot be updated");
    }

    return true;
  }),
  body("status").custom((value) => {
    if (value !== undefined) {
      throw new Error("status cannot be updated");
    }

    return true;
  }),
  body("role").custom((value) => {
    if (value !== undefined) {
      throw new Error("role cannot be updated");
    }

    return true;
  }),
  body("email").custom((value) => {
    if (value !== undefined) {
      throw new Error("email cannot be updated from profile");
    }

    return true;
  }),
  passwordComplexityRule("password", { optional: true }),
  body("fullName").optional().trim().notEmpty().withMessage("fullName cannot be empty").isLength({ max: 160 }).withMessage("fullName must be at most 160 characters"),
  body("phone").optional({ values: "falsy" }).trim().isLength({ max: 20 }).withMessage("phone must be at most 20 characters"),
  body("avatarUrl").optional({ values: "falsy" }).isURL().withMessage("avatarUrl must be a valid URL")
];

const purchaseOrderListRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("status").optional().isIn(purchaseOrderStatuses).withMessage(`status must be one of: ${purchaseOrderStatuses.join(", ")}`),
  query("supplier").optional().isMongoId().withMessage("supplier must be a valid ObjectId"),
  query("warehouse").optional().isMongoId().withMessage("warehouse must be a valid ObjectId"),
  query("code").optional().trim().isLength({ min: 1, max: 40 }).withMessage("code must be between 1 and 40 characters")
];

const purchaseOrderCreateRules = [
  body("code").optional({ values: "falsy" }).trim().isLength({ max: 40 }).withMessage("code must be at most 40 characters"),
  body("supplier").notEmpty().withMessage("supplier is required").isMongoId().withMessage("supplier must be a valid ObjectId"),
  body("warehouse").notEmpty().withMessage("warehouse is required").isMongoId().withMessage("warehouse must be a valid ObjectId"),
  body("expectedDate").optional({ values: "falsy" }).isISO8601().withMessage("expectedDate must be a valid ISO 8601 date"),
  body("note").optional({ values: "falsy" }).isLength({ max: 1000 }).withMessage("note must be at most 1000 characters"),
  body("items").isArray({ min: 1 }).withMessage("items must be a non-empty array"),
  body("items.*.product").notEmpty().withMessage("product is required").isMongoId().withMessage("product must be a valid ObjectId"),
  body("items.*.quantity").notEmpty().withMessage("quantity is required").isFloat({ gt: 0 }).withMessage("quantity must be greater than 0"),
  body("items.*.unitPrice").notEmpty().withMessage("unitPrice is required").isFloat({ min: 0 }).withMessage("unitPrice must be a non-negative number"),
  body("items.*.taxRate").optional().isFloat({ min: 0, max: 100 }).withMessage("taxRate must be between 0 and 100")
];

const purchaseOrderUpdateRules = [
  body("code").optional({ values: "falsy" }).trim().isLength({ max: 40 }).withMessage("code must be at most 40 characters"),
  body("supplier").notEmpty().withMessage("supplier is required").isMongoId().withMessage("supplier must be a valid ObjectId"),
  body("warehouse").notEmpty().withMessage("warehouse is required").isMongoId().withMessage("warehouse must be a valid ObjectId"),
  body("expectedDate").optional({ values: "falsy" }).isISO8601().withMessage("expectedDate must be a valid ISO 8601 date"),
  body("note").optional({ values: "falsy" }).isLength({ max: 1000 }).withMessage("note must be at most 1000 characters"),
  body("items").isArray({ min: 1 }).withMessage("items must be a non-empty array"),
  body("items.*.product").notEmpty().withMessage("product is required").isMongoId().withMessage("product must be a valid ObjectId"),
  body("items.*.quantity").notEmpty().withMessage("quantity is required").isFloat({ gt: 0 }).withMessage("quantity must be greater than 0"),
  body("items.*.unitPrice").notEmpty().withMessage("unitPrice is required").isFloat({ min: 0 }).withMessage("unitPrice must be a non-negative number"),
  body("items.*.taxRate").optional().isFloat({ min: 0, max: 100 }).withMessage("taxRate must be between 0 and 100")
];

const brandListRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`),
  query("search").optional().isString().withMessage("search must be a string")
];

const brandCreateRules = [
  body("name").trim().notEmpty().withMessage("name is required").isLength({ max: 160 }).withMessage("name must be at most 160 characters"),
  body("code").trim().notEmpty().withMessage("code is required").isLength({ max: 40 }).withMessage("code must be at most 40 characters"),
  body("description").optional({ values: "falsy" }).isLength({ max: 1000 }).withMessage("description must be at most 1000 characters"),
  body("countryOfOrigin").optional({ values: "falsy" }).isLength({ max: 120 }).withMessage("countryOfOrigin must be at most 120 characters"),
  body("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`)
];

const brandUpdateRules = [
  body("name").optional().trim().notEmpty().withMessage("name cannot be empty").isLength({ max: 160 }).withMessage("name must be at most 160 characters"),
  body("code").optional().trim().notEmpty().withMessage("code cannot be empty").isLength({ max: 40 }).withMessage("code must be at most 40 characters"),
  body("description").optional({ values: "falsy" }).isLength({ max: 1000 }).withMessage("description must be at most 1000 characters"),
  body("countryOfOrigin").optional({ values: "falsy" }).isLength({ max: 120 }).withMessage("countryOfOrigin must be at most 120 characters"),
  body("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`)
];

const unitListRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`),
  query("search").optional().isString().withMessage("search must be a string")
];

const unitCreateRules = [
  body("name").trim().notEmpty().withMessage("name is required").isLength({ max: 80 }).withMessage("name must be at most 80 characters"),
  body("code").trim().notEmpty().withMessage("code is required").isLength({ max: 30 }).withMessage("code must be at most 30 characters"),
  body("symbol").optional({ values: "falsy" }).isLength({ max: 20 }).withMessage("symbol must be at most 20 characters"),
  body("precision").optional().isInt({ min: 0, max: 6 }).withMessage("precision must be between 0 and 6"),
  body("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`)
];

const unitUpdateRules = [
  body("name").optional().trim().notEmpty().withMessage("name cannot be empty").isLength({ max: 80 }).withMessage("name must be at most 80 characters"),
  body("code").optional().trim().notEmpty().withMessage("code cannot be empty").isLength({ max: 30 }).withMessage("code must be at most 30 characters"),
  body("symbol").optional({ values: "falsy" }).isLength({ max: 20 }).withMessage("symbol must be at most 20 characters"),
  body("precision").optional().isInt({ min: 0, max: 6 }).withMessage("precision must be between 0 and 6"),
  body("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`)
];

const supplierListRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`),
  query("search").optional().isString().withMessage("search must be a string")
];

const supplierCreateRules = [
  body("name").trim().notEmpty().withMessage("name is required").isLength({ max: 160 }).withMessage("name must be at most 160 characters"),
  body("code").trim().notEmpty().withMessage("code is required").isLength({ max: 40 }).withMessage("code must be at most 40 characters"),
  body("contactName").optional({ values: "falsy" }).isLength({ max: 120 }).withMessage("contactName must be at most 120 characters"),
  body("phone").optional({ values: "falsy" }).isLength({ max: 20 }).withMessage("phone must be at most 20 characters"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("email must be valid").isLength({ max: 160 }).withMessage("email must be at most 160 characters"),
  body("taxCode").optional({ values: "falsy" }).isLength({ max: 40 }).withMessage("taxCode must be at most 40 characters"),
  body("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`)
];

const supplierUpdateRules = [
  body("name").optional().trim().notEmpty().withMessage("name cannot be empty").isLength({ max: 160 }).withMessage("name must be at most 160 characters"),
  body("code").optional().trim().notEmpty().withMessage("code cannot be empty").isLength({ max: 40 }).withMessage("code must be at most 40 characters"),
  body("contactName").optional({ values: "falsy" }).isLength({ max: 120 }).withMessage("contactName must be at most 120 characters"),
  body("phone").optional({ values: "falsy" }).isLength({ max: 20 }).withMessage("phone must be at most 20 characters"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("email must be valid").isLength({ max: 160 }).withMessage("email must be at most 160 characters"),
  body("taxCode").optional({ values: "falsy" }).isLength({ max: 40 }).withMessage("taxCode must be at most 40 characters"),
  body("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`)
];

const warehouseListRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`),
  query("manager").optional().isMongoId().withMessage("manager must be a valid ObjectId"),
  query("search").optional().isString().withMessage("search must be a string")
];

const warehouseCreateRules = [
  body("name").trim().notEmpty().withMessage("name is required").isLength({ max: 160 }).withMessage("name must be at most 160 characters"),
  body("code").trim().notEmpty().withMessage("code is required").isLength({ max: 40 }).withMessage("code must be at most 40 characters"),
  body("description").optional({ values: "falsy" }).isLength({ max: 800 }).withMessage("description must be at most 800 characters"),
  body("manager").optional({ values: "falsy" }).isMongoId().withMessage("manager must be a valid ObjectId"),
  body("contactPhone").optional({ values: "falsy" }).isLength({ max: 20 }).withMessage("contactPhone must be at most 20 characters"),
  body("contactEmail").optional({ values: "falsy" }).isEmail().withMessage("contactEmail must be valid").isLength({ max: 160 }).withMessage("contactEmail must be at most 160 characters"),
  body("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`)
];

const warehouseUpdateRules = [
  body("name").optional().trim().notEmpty().withMessage("name cannot be empty").isLength({ max: 160 }).withMessage("name must be at most 160 characters"),
  body("code").optional().trim().notEmpty().withMessage("code cannot be empty").isLength({ max: 40 }).withMessage("code must be at most 40 characters"),
  body("description").optional({ values: "falsy" }).isLength({ max: 800 }).withMessage("description must be at most 800 characters"),
  body("manager").optional({ values: "falsy" }).isMongoId().withMessage("manager must be a valid ObjectId"),
  body("contactPhone").optional({ values: "falsy" }).isLength({ max: 20 }).withMessage("contactPhone must be at most 20 characters"),
  body("contactEmail").optional({ values: "falsy" }).isEmail().withMessage("contactEmail must be valid").isLength({ max: 160 }).withMessage("contactEmail must be at most 160 characters"),
  body("status").optional().isIn(commonStatuses).withMessage(`status must be one of: ${commonStatuses.join(", ")}`)
];

const inventoryListRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("warehouse").optional().isMongoId().withMessage("warehouse must be a valid ObjectId"),
  query("product").optional().isMongoId().withMessage("product must be a valid ObjectId"),
  query("lowStock").optional().isBoolean().withMessage("lowStock must be true or false"),
  query("belowMinStock").optional().isBoolean().withMessage("belowMinStock must be true or false")
];

const inventoryCreateRules = [
  body("warehouse").notEmpty().withMessage("warehouse is required").isMongoId().withMessage("warehouse must be a valid ObjectId"),
  body("product").notEmpty().withMessage("product is required").isMongoId().withMessage("product must be a valid ObjectId"),
  body("quantityOnHand").optional().isFloat({ min: 0 }).withMessage("quantityOnHand must be a non-negative number"),
  body("reservedQuantity").optional().isFloat({ min: 0 }).withMessage("reservedQuantity must be a non-negative number"),
  body("reorderPoint").optional().isFloat({ min: 0 }).withMessage("reorderPoint must be a non-negative number"),
  body("minStockLevel").optional().isFloat({ min: 0 }).withMessage("minStockLevel must be a non-negative number"),
  body("maxStockLevel").optional().isFloat({ min: 0 }).withMessage("maxStockLevel must be a non-negative number"),
  body("openingNote").optional({ values: "falsy" }).isLength({ max: 500 }).withMessage("openingNote must be at most 500 characters")
];

const inventoryUpdateRules = [
  body("quantityOnHand").optional().isFloat({ min: 0 }).withMessage("quantityOnHand must be a non-negative number"),
  body("reservedQuantity").optional().isFloat({ min: 0 }).withMessage("reservedQuantity must be a non-negative number"),
  body("reorderPoint").optional().isFloat({ min: 0 }).withMessage("reorderPoint must be a non-negative number"),
  body("minStockLevel").optional().isFloat({ min: 0 }).withMessage("minStockLevel must be a non-negative number"),
  body("maxStockLevel").optional().isFloat({ min: 0 }).withMessage("maxStockLevel must be a non-negative number"),
  body("adjustmentNote").optional({ values: "falsy" }).isLength({ max: 500 }).withMessage("adjustmentNote must be at most 500 characters")
];

const transferOrderListRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("status").optional().isIn(transferOrderStatuses).withMessage(`status must be one of: ${transferOrderStatuses.join(", ")}`),
  query("fromWarehouse").optional().isMongoId().withMessage("fromWarehouse must be a valid ObjectId"),
  query("toWarehouse").optional().isMongoId().withMessage("toWarehouse must be a valid ObjectId"),
  query("code").optional().trim().isLength({ min: 1, max: 40 }).withMessage("code must be between 1 and 40 characters")
];

const transferOrderCreateRules = [
  body("code").optional({ values: "falsy" }).trim().isLength({ max: 40 }).withMessage("code must be at most 40 characters"),
  body("fromWarehouse").notEmpty().withMessage("fromWarehouse is required").isMongoId().withMessage("fromWarehouse must be a valid ObjectId"),
  body("toWarehouse")
    .notEmpty()
    .withMessage("toWarehouse is required")
    .isMongoId()
    .withMessage("toWarehouse must be a valid ObjectId")
    .custom((value, { req }) => value !== req.body.fromWarehouse)
    .withMessage("toWarehouse must be different from fromWarehouse"),
  body("note").optional({ values: "falsy" }).isLength({ max: 1000 }).withMessage("note must be at most 1000 characters"),
  body("items").isArray({ min: 1 }).withMessage("items must be a non-empty array"),
  body("items.*.product").notEmpty().withMessage("product is required").isMongoId().withMessage("product must be a valid ObjectId"),
  body("items.*.quantityRequested").notEmpty().withMessage("quantityRequested is required").isFloat({ gt: 0 }).withMessage("quantityRequested must be greater than 0"),
  body("items.*.note").optional({ values: "falsy" }).isLength({ max: 500 }).withMessage("item note must be at most 500 characters")
];

const transferOrderUpdateRules = [
  body("code").optional({ values: "falsy" }).trim().isLength({ max: 40 }).withMessage("code must be at most 40 characters"),
  body("fromWarehouse").notEmpty().withMessage("fromWarehouse is required").isMongoId().withMessage("fromWarehouse must be a valid ObjectId"),
  body("toWarehouse")
    .notEmpty()
    .withMessage("toWarehouse is required")
    .isMongoId()
    .withMessage("toWarehouse must be a valid ObjectId")
    .custom((value, { req }) => value !== req.body.fromWarehouse)
    .withMessage("toWarehouse must be different from fromWarehouse"),
  body("note").optional({ values: "falsy" }).isLength({ max: 1000 }).withMessage("note must be at most 1000 characters"),
  body("items").isArray({ min: 1 }).withMessage("items must be a non-empty array"),
  body("items.*.product").notEmpty().withMessage("product is required").isMongoId().withMessage("product must be a valid ObjectId"),
  body("items.*.quantityRequested").notEmpty().withMessage("quantityRequested is required").isFloat({ gt: 0 }).withMessage("quantityRequested must be greater than 0"),
  body("items.*.note").optional({ values: "falsy" }).isLength({ max: 500 }).withMessage("item note must be at most 500 characters")
];

const purchaseOrderPartialReceiveRules = [
  body("note").optional({ values: "falsy" }).isLength({ max: 500 }).withMessage("note must be at most 500 characters"),
  body("items").isArray({ min: 1 }).withMessage("items must be a non-empty array"),
  body("items.*.purchaseOrderItemId")
    .notEmpty()
    .withMessage("purchaseOrderItemId is required")
    .isMongoId()
    .withMessage("purchaseOrderItemId must be a valid ObjectId"),
  body("items.*.receivedQuantity")
    .notEmpty()
    .withMessage("receivedQuantity is required")
    .isFloat({ gt: 0 })
    .withMessage("receivedQuantity must be greater than 0"),
  body("items").custom((items) => {
    const ids = items.map((item) => item.purchaseOrderItemId);
    const uniqueIds = new Set(ids);

    if (uniqueIds.size !== ids.length) {
      throw new Error("purchaseOrderItemId must not be duplicated in items");
    }

    return true;
  })
];

const purchaseOrderReceiveRules = [
  body("note").optional({ values: "falsy" }).isLength({ max: 500 }).withMessage("note must be at most 500 characters"),
  body("items").optional().isArray().withMessage("items must be an array"),
  body("items.*.purchaseOrderItemId")
    .optional()
    .notEmpty()
    .withMessage("purchaseOrderItemId is required")
    .isMongoId()
    .withMessage("purchaseOrderItemId must be a valid ObjectId"),
  body("items").optional().custom((items = []) => {
    const ids = items.map((item) => item.purchaseOrderItemId);
    const uniqueIds = new Set(ids);

    if (uniqueIds.size !== ids.length) {
      throw new Error("purchaseOrderItemId must not be duplicated in items");
    }

    return true;
  })
];

const batchLotFieldsRules = [
  body("product").notEmpty().withMessage("product is required").isMongoId().withMessage("product must be a valid ObjectId"),
  body("warehouse").notEmpty().withMessage("warehouse is required").isMongoId().withMessage("warehouse must be a valid ObjectId"),
  body("lotCode").trim().notEmpty().withMessage("lotCode is required").isLength({ max: 50 }).withMessage("lotCode must be at most 50 characters"),
  body("manufactureDate").optional({ values: "falsy" }).isISO8601().withMessage("manufactureDate must be a valid ISO 8601 date"),
  body("expiryDate").optional({ values: "falsy" }).isISO8601().withMessage("expiryDate must be a valid ISO 8601 date"),
  body("quantity").notEmpty().withMessage("quantity is required").isFloat({ min: 0 }).withMessage("quantity must be a non-negative number"),
  body("status").optional().isIn(batchLotStatuses).withMessage(`status must be one of: ${batchLotStatuses.join(", ")}`)
];

const batchLotListRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("product").optional().isMongoId().withMessage("product must be a valid ObjectId"),
  query("warehouse").optional().isMongoId().withMessage("warehouse must be a valid ObjectId"),
  query("status").optional().isIn(batchLotStatuses).withMessage(`status must be one of: ${batchLotStatuses.join(", ")}`),
  query("lotCode").optional().trim().isLength({ min: 1, max: 50 }).withMessage("lotCode must be between 1 and 50 characters"),
  query("expiryDate").optional().isISO8601().withMessage("expiryDate must be a valid ISO 8601 date")
];

const batchLotCreateRules = [
  ...batchLotFieldsRules,
  body().custom((payload) => {
    if (payload.manufactureDate && payload.expiryDate && new Date(payload.manufactureDate) > new Date(payload.expiryDate)) {
      throw new Error("manufactureDate must be before or equal to expiryDate");
    }

    return true;
  })
];

const batchLotUpdateRules = [
  body("product").optional().isMongoId().withMessage("product must be a valid ObjectId"),
  body("warehouse").optional().isMongoId().withMessage("warehouse must be a valid ObjectId"),
  body("lotCode").optional().trim().notEmpty().withMessage("lotCode cannot be empty").isLength({ max: 50 }).withMessage("lotCode must be at most 50 characters"),
  body("manufactureDate").optional({ values: "falsy" }).isISO8601().withMessage("manufactureDate must be a valid ISO 8601 date"),
  body("expiryDate").optional({ values: "falsy" }).isISO8601().withMessage("expiryDate must be a valid ISO 8601 date"),
  body("quantity").optional().isFloat({ min: 0 }).withMessage("quantity must be a non-negative number"),
  body("status").optional().isIn(batchLotStatuses).withMessage(`status must be one of: ${batchLotStatuses.join(", ")}`),
  body().custom((payload) => {
    if (payload.manufactureDate && payload.expiryDate && new Date(payload.manufactureDate) > new Date(payload.expiryDate)) {
      throw new Error("manufactureDate must be before or equal to expiryDate");
    }

    return true;
  })
];

const batchLotStatusRules = [
  body("status")
    .notEmpty()
    .withMessage("status is required")
    .isIn(batchLotStatuses)
    .withMessage(`status must be one of: ${batchLotStatuses.join(", ")}`)
];

const batchLotReceiveItemRules = [
  body("items.*.batchLots").optional().isArray({ min: 1 }).withMessage("batchLots must be a non-empty array"),
  body("items.*.batchLots.*.lotCode")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("lotCode is required")
    .isLength({ max: 50 })
    .withMessage("lotCode must be at most 50 characters"),
  body("items.*.batchLots.*.manufactureDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("manufactureDate must be a valid ISO 8601 date"),
  body("items.*.batchLots.*.expiryDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("expiryDate must be a valid ISO 8601 date"),
  body("items.*.batchLots.*.quantity")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("batchLots quantity must be greater than 0")
];

module.exports = {
  validate,
  mongoIdParamRule,
  loginRules,
  activationTokenQueryRules,
  activateAccountRules,
  productListRules,
  productCreateRules,
  productUpdateRules,
  userListRules,
  userCreateRules,
  userUpdateRules,
  userSelfUpdateRules,
  purchaseOrderListRules,
  purchaseOrderCreateRules,
  purchaseOrderUpdateRules,
  purchaseOrderPartialReceiveRules,
  purchaseOrderReceiveRules,
  brandListRules,
  brandCreateRules,
  brandUpdateRules,
  unitListRules,
  unitCreateRules,
  unitUpdateRules,
  supplierListRules,
  supplierCreateRules,
  supplierUpdateRules,
  batchLotListRules,
  batchLotCreateRules,
  batchLotUpdateRules,
  batchLotStatusRules,
  batchLotReceiveItemRules,
  warehouseListRules,
  warehouseCreateRules,
  warehouseUpdateRules,
  inventoryListRules,
  inventoryCreateRules,
  inventoryUpdateRules,
  transferOrderListRules,
  transferOrderCreateRules,
  transferOrderUpdateRules,
};
