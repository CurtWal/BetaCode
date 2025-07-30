const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Access Denied" });
  }

  const token = authHeader.split(" ")[1];
  //console.log("Extracted Token:", token); // Debugging
  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    //console.log("Decoded Token:", req.user);
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

const checkRole = (roles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: "Access Denied" });
  }

  // Normalize to array for consistency
  const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];

  const hasRole = roles.some((r) => userRoles.includes(r));

  if (!hasRole) {
    return res.status(403).json({ message: "Access Denied: Insufficient Permissions" });
  }

  next();
};

module.exports = { verifyToken, checkRole };
