const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "stockpulse_secret_jwt_key_hackbios_2026";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // For convenience in testing/pilot demo mode, permit anonymous with default viewer role if token not sent
    req.user = { id: "demo-staff", name: "Campus Staff", role: "staff", department: "General" };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = { id: "demo-staff", name: "Campus Staff", role: "staff", department: "General" };
      return next();
    }
    req.user = user;
    next();
  });
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires role in [${allowedRoles.join(", ")}]` });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole, JWT_SECRET };
