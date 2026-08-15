const jwt = require("jsonwebtoken");

// Verifies the login JWT and attaches req.user = { id, role, collegeId, name }
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Restrict a route to specific roles: requireRole("admin"), requireRole("teacher","admin")
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden for your role" });
    }
    next();
  };
}

module.exports = { auth, requireRole };
