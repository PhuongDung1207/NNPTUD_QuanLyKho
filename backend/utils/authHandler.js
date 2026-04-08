const jwt = require("jsonwebtoken");

const { User } = require("../schemas");

function getJwtSecret() {
  return process.env.JWT_SECRET || "warehouse-dev-secret";
}

function getTokenFromRequest(req) {
  const authorization = req.headers.authorization || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  return req.cookies?.accessToken || null;
}

async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ message: "ban chua dang nhap" });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findOne({
      _id: payload.sub || payload.id,
      deletedAt: null
    }).populate({
      path: "role",
      select: "name code description"
    });

    if (!user) {
      return res.status(401).json({ message: "ban chua dang nhap" });
    }

    if (user.status === "locked") {
      return res.status(423).json({ message: "tai khoan da bi khoa" });
    }

    if (user.email && !user.emailVerifiedAt) {
      return res.status(403).json({ message: "tai khoan chua xac thuc email" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "tai khoan khong hoat dong" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "ban chua dang nhap" });
  }
}

function authorizeRoles(...allowedRoles) {
  return function roleGuard(req, res, next) {
    const roleName = req.user?.role?.name;

    if (!roleName || !allowedRoles.includes(roleName)) {
      return res.status(403).json({ message: "ban khong co quyen truy cap" });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  authorizeRoles,
  getJwtSecret,
  getTokenFromRequest
};
