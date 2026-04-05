const mongoose = require("mongoose");
const createError = require("http-errors");
const XLSX = require("xlsx");

const { User, Role } = require("../schemas");
const { createActivationToken, sendActivationEmail } = require("../utils/accountActivation");

const userPopulate = [
  {
    path: "role",
    select: "name code description permissions",
    populate: {
      path: "permissions",
      select: "name code module action description"
    }
  }
];

const USER_IMPORT_MAX_ROWS = 200;

const USER_IMPORT_FIELD_ALIASES = {
  username: ["username", "user", "tendangnhap"],
  fullName: ["fullname", "full_name", "full name", "name", "hoten"],
  email: ["email", "mail"],
  phone: ["phone", "phonenumber", "phone_number", "mobile", "sodienthoai"],
  avatarUrl: ["avatarurl", "avatar_url", "avatar", "imageurl", "image_url"],
  role: ["role", "roles", "vaitro"],
  passwordIgnored: ["password", "matkhau"],
  statusIgnored: ["status", "stastus", "trangthai"]
};

const USER_IMPORT_REQUIRED_FIELDS = ["username", "fullName", "email"];

function cleanUndefined(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function normalizeOptionalString(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = String(value).trim();

  return normalizedValue || undefined;
}

function parseDuplicateKey(error) {
  const field = Object.keys(error.keyPattern || {})[0] || "field";

  return `${field} already exists`;
}

function parseValidationError(error) {
  if (error?.code === 11000) {
    return parseDuplicateKey(error);
  }

  if (error?.errors && typeof error.errors === "object") {
    const messages = Object.values(error.errors)
      .map((issue) => issue?.message)
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  return error?.message || "Unknown error";
}

function normalizeImportHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getImportFieldByHeader(header) {
  const normalizedHeader = normalizeImportHeader(header);

  return Object.entries(USER_IMPORT_FIELD_ALIASES).find(([, aliases]) => (
    aliases.includes(normalizedHeader)
  ))?.[0];
}

function mapImportHeaders(headerRow) {
  return headerRow.reduce((accumulator, headerValue, columnIndex) => {
    const field = getImportFieldByHeader(headerValue);

    if (field && accumulator[field] === undefined) {
      accumulator[field] = columnIndex;
    }

    return accumulator;
  }, {});
}

function getImportedCellValue(row, headerIndexes, field) {
  const columnIndex = headerIndexes[field];

  if (columnIndex === undefined) {
    return undefined;
  }

  const rawValue = row[columnIndex];

  if (rawValue === undefined || rawValue === null) {
    return undefined;
  }

  const stringValue = String(rawValue).trim();

  return stringValue || undefined;
}

function isRowEmpty(row) {
  return !row.some((cellValue) => isNonEmptyString(String(cellValue || "")));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isValidUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return Boolean(url.protocol && url.host);
  } catch (error) {
    return false;
  }
}

function validateImportedUserPayload(payload) {
  const errors = [];

  if (!isNonEmptyString(payload.username)) {
    errors.push("username is required");
  } else if (payload.username.length > 60) {
    errors.push("username must be at most 60 characters");
  }

  if (!isNonEmptyString(payload.fullName)) {
    errors.push("fullName is required");
  } else if (payload.fullName.length > 160) {
    errors.push("fullName must be at most 160 characters");
  }

  if (!isNonEmptyString(payload.email)) {
    errors.push("email is required");
  } else {
    if (payload.email.length > 160) {
      errors.push("email must be at most 160 characters");
    }

    if (!isValidEmail(payload.email)) {
      errors.push("email must be valid");
    }
  }

  if (payload.phone && payload.phone.length > 20) {
    errors.push("phone must be at most 20 characters");
  }

  if (payload.avatarUrl && !isValidUrl(payload.avatarUrl)) {
    errors.push("avatarUrl must be a valid URL");
  }

  return errors;
}

function buildImportedUserPayload(row, headerIndexes) {
  return cleanUndefined({
    username: getImportedCellValue(row, headerIndexes, "username"),
    fullName: getImportedCellValue(row, headerIndexes, "fullName"),
    email: getImportedCellValue(row, headerIndexes, "email"),
    phone: getImportedCellValue(row, headerIndexes, "phone"),
    avatarUrl: getImportedCellValue(row, headerIndexes, "avatarUrl"),
    role: getImportedCellValue(row, headerIndexes, "role")
  });
}

function parseWorkbookRows(fileBuffer) {
  let workbook;

  try {
    workbook = XLSX.read(fileBuffer, { type: "buffer" });
  } catch (error) {
    throw createError(400, "Failed to read Excel file. Please upload a valid .xlsx file");
  }

  const [sheetName] = workbook.SheetNames || [];

  if (!sheetName) {
    throw createError(400, "Excel file does not contain any worksheet");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false
  });

  if (rawRows.length === 0) {
    throw createError(400, "Excel file is empty");
  }

  const [headerRow, ...dataRows] = rawRows;
  const headerIndexes = mapImportHeaders(headerRow);
  const missingFields = USER_IMPORT_REQUIRED_FIELDS.filter(
    (field) => headerIndexes[field] === undefined
  );

  if (missingFields.length > 0) {
    throw createError(
      400,
      `Excel file is missing required columns: ${missingFields.join(", ")}`
    );
  }

  const records = dataRows
    .map((row, index) => ({
      rowNumber: index + 2,
      row
    }))
    .filter(({ row }) => Array.isArray(row) && !isRowEmpty(row));

  if (records.length === 0) {
    throw createError(400, "Excel file does not contain any user rows");
  }

  if (records.length > USER_IMPORT_MAX_ROWS) {
    throw createError(400, `Excel import supports up to ${USER_IMPORT_MAX_ROWS} rows at a time`);
  }

  const warnings = [];

  if (headerIndexes.passwordIgnored !== undefined) {
    warnings.push("Cot password trong file se bi bo qua. Nguoi dung se tu dat mat khau trong email kich hoat.");
  }

  if (headerIndexes.statusIgnored !== undefined) {
    warnings.push("Cot status/stastus trong file se bi bo qua. Tai khoan import luon duoc tao o trang thai inactive.");
  }

  return {
    sheetName,
    headerIndexes,
    records,
    warnings
  };
}

function populateUserQuery(query) {
  return query.populate(userPopulate);
}

function isEmailVerified(user) {
  return Boolean(user?.emailVerifiedAt);
}

function applyActivationState(user, activation) {
  user.status = "inactive";
  user.emailVerifiedAt = null;
  user.activationTokenHash = activation.tokenHash;
  user.activationTokenExpiresAt = activation.expiresAt;
  user.activationEmailSentAt = new Date();
  user.activationCompletedAt = null;
}

async function issueActivationForUser(user, options = {}) {
  if (!user.email) {
    throw createError(400, "Email is required to send activation link");
  }

  const appBaseUrl = String(options.appBaseUrl || "").trim();

  if (!appBaseUrl) {
    throw createError(500, "APP_BASE_URL is not configured");
  }

  const activation = createActivationToken();

  applyActivationState(user, activation);
  await user.save();
  await sendActivationEmail({
    user,
    token: activation.token,
    appBaseUrl
  });
}

async function findUserByIdOrThrow(id) {
  const user = await User.findOne({
    _id: id,
    deletedAt: null
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  return user;
}

async function getPopulatedUserById(id) {
  const user = await populateUserQuery(
    User.findOne({
      _id: id,
      deletedAt: null
    })
  );

  if (!user) {
    throw createError(404, "User not found");
  }

  return user;
}

async function resolveRole(roleInput, options = {}) {
  const fallbackToUserRole = options.fallbackToUserRole === true;

  if (!roleInput && !fallbackToUserRole) {
    return null;
  }

  const normalizedInput = roleInput
    ? String(roleInput).trim()
    : "user";

  let role = null;

  if (mongoose.Types.ObjectId.isValid(normalizedInput)) {
    role = await Role.findById(normalizedInput);
  }

  if (!role) {
    role = await Role.findOne({
      $or: [
        { name: normalizedInput.toLowerCase() },
        { code: normalizedInput.toUpperCase() }
      ]
    });
  }

  if (!role) {
    throw createError(400, "Role not found");
  }

  return role;
}

async function ensureNotLastActiveAdmin(user, options = {}) {
  const {
    nextRoleId,
    nextStatus,
    deleting = false
  } = options;

  const adminRole = await Role.findOne({ name: "admin" }).select("_id");

  if (!adminRole) {
    return;
  }

  const isAdmin = String(user.role) === String(adminRole._id);

  if (!isAdmin || user.status !== "active") {
    return;
  }

  const willRemainAdmin = nextRoleId ? String(nextRoleId) === String(adminRole._id) : true;
  const willRemainActive = nextStatus ? nextStatus === "active" : true;

  if (!deleting && willRemainAdmin && willRemainActive) {
    return;
  }

  const otherActiveAdmins = await User.countDocuments({
    _id: { $ne: user._id },
    role: adminRole._id,
    status: "active",
    deletedAt: null
  });

  if (otherActiveAdmins === 0) {
    throw createError(400, "Cannot update or delete the last active admin");
  }
}

function assertNotSelf(actorId, targetId, action) {
  if (actorId && String(actorId) === String(targetId)) {
    throw createError(400, `Cannot ${action} your own account`);
  }
}

async function listUsers(filters = {}) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;

  const query = {
    deletedAt: null
  };

  if (filters.search) {
    query.$or = [
      { username: { $regex: filters.search, $options: "i" } },
      { fullName: { $regex: filters.search, $options: "i" } },
      { email: { $regex: filters.search, $options: "i" } }
    ];
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.role) {
    const role = await resolveRole(filters.role);
    query.role = role._id;
  }

  const [users, total] = await Promise.all([
    populateUserQuery(
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ),
    User.countDocuments(query)
  ]);

  return {
    message: "Users fetched successfully",
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

async function getUserById(id) {
  return getPopulatedUserById(id);
}

async function getCurrentUser(userId) {
  return getPopulatedUserById(userId);
}

async function updateCurrentUser(userId, payload) {
  const user = await findUserByIdOrThrow(userId);

  user.fullName = payload.fullName !== undefined ? payload.fullName : user.fullName;

  if (payload.password !== undefined) {
    user.password = payload.password;
  }

  if (payload.phone !== undefined) {
    user.phone = normalizeOptionalString(payload.phone);
  }

  if (payload.avatarUrl !== undefined) {
    user.avatarUrl = normalizeOptionalString(payload.avatarUrl);
  }

  try {
    await user.save();
    return getPopulatedUserById(user._id);
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }

    throw error;
  }
}

async function createUser(payload, options = {}) {
  try {
    const role = await resolveRole(payload.role, { fallbackToUserRole: true });

    const user = await User.create(
      cleanUndefined({
        username: payload.username,
        fullName: payload.fullName,
        status: "inactive",
        role: role._id,
        email: normalizeOptionalString(payload.email),
        phone: normalizeOptionalString(payload.phone),
        avatarUrl: normalizeOptionalString(payload.avatarUrl),
        emailVerifiedAt: null,
        activationTokenHash: null,
        activationTokenExpiresAt: null,
        activationEmailSentAt: null,
        activationCompletedAt: null
      })
    );

    try {
      await issueActivationForUser(user, options);
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }

    return getPopulatedUserById(user._id);
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }

    throw error;
  }
}

async function importUsersFromWorkbook(fileBuffer, options = {}) {
  const { sheetName, headerIndexes, records, warnings } = parseWorkbookRows(fileBuffer);
  const created = [];
  const failures = [];
  const seenUsernames = new Set();
  const seenEmails = new Set();

  for (const { rowNumber, row } of records) {
    const payload = buildImportedUserPayload(row, headerIndexes);
    const usernameKey = String(payload.username || "").trim().toLowerCase();
    const emailKey = String(payload.email || "").trim().toLowerCase();
    const rowErrors = validateImportedUserPayload(payload);

    if (usernameKey && seenUsernames.has(usernameKey)) {
      rowErrors.push("Duplicate username in the uploaded file");
    }

    if (emailKey && seenEmails.has(emailKey)) {
      rowErrors.push("Duplicate email in the uploaded file");
    }

    if (rowErrors.length > 0) {
      failures.push({
        row: rowNumber,
        username: payload.username || null,
        email: payload.email || null,
        reason: rowErrors.join(", ")
      });
      continue;
    }

    seenUsernames.add(usernameKey);
    seenEmails.add(emailKey);

    try {
      const user = await createUser(payload, options);

      created.push({
        row: rowNumber,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      });
    } catch (error) {
      failures.push({
        row: rowNumber,
        username: payload.username || null,
        email: payload.email || null,
        reason: parseValidationError(error)
      });
    }
  }

  return {
    summary: {
      sheetName,
      totalRows: records.length,
      createdCount: created.length,
      failedCount: failures.length
    },
    warnings,
    created,
    failures
  };
}

async function updateUserById(id, payload, actorId, options = {}) {
  const user = await findUserByIdOrThrow(id);

  if (payload.username !== undefined) {
    throw createError(400, "Username cannot be updated");
  }

  if (payload.status === "active" && !isEmailVerified(user)) {
    throw createError(400, "Cannot activate account before email verification");
  }

  const nextRole = payload.role !== undefined ? await resolveRole(payload.role) : null;
  const nextEmail = payload.email !== undefined
    ? normalizeOptionalString(payload.email)
    : undefined;
  const emailChanged = nextEmail !== undefined && nextEmail !== user.email;
  const nextStatus = emailChanged
    ? "inactive"
    : payload.status;

  if (payload.status === "locked") {
    assertNotSelf(actorId, user._id, "lock");
  }

  await ensureNotLastActiveAdmin(user, {
    nextRoleId: nextRole?._id,
    nextStatus
  });

  try {
    user.fullName = payload.fullName !== undefined ? payload.fullName : user.fullName;
    user.status = nextStatus !== undefined ? nextStatus : user.status;
    user.role = nextRole ? nextRole._id : user.role;

    if (payload.password !== undefined) {
      user.password = payload.password;
    }

    if (nextEmail !== undefined) {
      user.email = nextEmail;
    }

    if (payload.phone !== undefined) {
      user.phone = normalizeOptionalString(payload.phone);
    }

    if (payload.avatarUrl !== undefined) {
      user.avatarUrl = normalizeOptionalString(payload.avatarUrl);
    }

    if (emailChanged) {
      await issueActivationForUser(user, options);

      return {
        user: await getPopulatedUserById(user._id),
        activationEmailSent: true
      };
    }

    await user.save();

    return {
      user: await getPopulatedUserById(user._id),
      activationEmailSent: false
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(409, parseDuplicateKey(error));
    }

    throw error;
  }
}

async function deleteUserById(id, actorId) {
  const user = await findUserByIdOrThrow(id);

  assertNotSelf(actorId, user._id, "delete");
  await ensureNotLastActiveAdmin(user, { deleting: true });

  await User.deleteOne({ _id: user._id });

  return user;
}

async function resendActivationInviteById(id, options = {}) {
  const user = await findUserByIdOrThrow(id);

  if (isEmailVerified(user) && user.status === "active") {
    throw createError(400, "User account is already activated");
  }

  try {
    await issueActivationForUser(user, options);
    return getPopulatedUserById(user._id);
  } catch (error) {
    if (error.status) {
      throw error;
    }

    throw createError(500, "Failed to send activation email");
  }
}

async function lockUserById(id, actorId) {
  const user = await findUserByIdOrThrow(id);

  assertNotSelf(actorId, user._id, "lock");
  await ensureNotLastActiveAdmin(user, { nextStatus: "locked" });

  user.status = "locked";
  await user.save();

  return getPopulatedUserById(user._id);
}

async function unlockUserById(id) {
  const user = await findUserByIdOrThrow(id);

  user.status = isEmailVerified(user) ? "active" : "inactive";
  await user.save();

  return getPopulatedUserById(user._id);
}

module.exports = {
  listUsers,
  getUserById,
  getCurrentUser,
  updateCurrentUser,
  createUser,
  importUsersFromWorkbook,
  updateUserById,
  deleteUserById,
  resendActivationInviteById,
  lockUserById,
  unlockUserById
};
