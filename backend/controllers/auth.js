const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const { User } = require("../schemas");
const { getJwtSecret } = require("../utils/authHandler");
const { hashActivationToken } = require("../utils/accountActivation");

const authPopulate = [
  {
    path: "role",
    select: "name code description permissions",
    populate: {
      path: "permissions",
      select: "name code module action description"
    }
  }
];

async function findUserByActivationTokenOrThrow(token) {
  const activationTokenHash = hashActivationToken(token);
  const user = await User.findOne({
    activationTokenHash,
    deletedAt: null
  }).select("+activationTokenHash +password");

  if (!user) {
    throw createError(400, "Activation link is invalid or has expired");
  }

  if (!user.activationTokenExpiresAt || user.activationTokenExpiresAt.getTime() < Date.now()) {
    throw createError(400, "Activation link is invalid or has expired");
  }

  return user;
}

function toActivationPreview(user) {
  return {
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    expiresAt: user.activationTokenExpiresAt
  };
}

async function getActivationPreview(token) {
  const user = await findUserByActivationTokenOrThrow(token);
  return toActivationPreview(user);
}

async function activateAccount(payload) {
  const token = String(payload.token || "").trim();
  const password = String(payload.password || "");
  const user = await findUserByActivationTokenOrThrow(token);
  const now = new Date();

  user.password = password;
  user.status = "active";
  user.emailVerifiedAt = now;
  user.activationCompletedAt = now;
  user.activationTokenHash = null;
  user.activationTokenExpiresAt = null;

  await user.save();

  return toActivationPreview(user);
}

async function login(payload) {
  const identity = String(payload.username || payload.identity || "").trim().toLowerCase();
  const password = String(payload.password || "");

  const user = await User.findOne({
    deletedAt: null,
    $or: [
      { username: identity },
      { email: identity }
    ]
  })
    .select("+password")
    .populate(authPopulate);

  if (!user) {
    throw createError(401, "Invalid username or password");
  }

  if (user.status === "locked") {
    throw createError(423, "User account is locked");
  }

  if (user.email && !user.emailVerifiedAt) {
    throw createError(403, "User account is not activated. Please check your email");
  }

  if (user.status !== "active") {
    throw createError(403, "User account is inactive");
  }

  if (!user.password) {
    throw createError(403, "User account setup is incomplete");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createError(401, "Invalid username or password");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign(
    {
      sub: user._id,
      role: user.role?.name
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    }
  );

  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    token,
    user: userResponse
  };
}

module.exports = {
  login,
  getActivationPreview,
  activateAccount
};
