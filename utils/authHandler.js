const jwt = require("jsonwebtoken");

const { User } = require("../schemas");

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

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub || payload.id).populate("role");

    if (!user) {
      return res.status(401).json({ message: "ban chua dang nhap" });
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
  authorizeRoles
};
