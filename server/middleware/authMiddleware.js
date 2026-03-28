const jwt = require("jsonwebtoken");
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans le fichier .env");
}

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Accès refusé : token manquant" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (_error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

function authorizeRoles(...allowedRoles) {
  const roles = allowedRoles.map((r) => String(r).trim().toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const currentRole = String(req.user.role || "").trim().toLowerCase();

    if (!roles.includes(currentRole)) {
      return res.status(403).json({ message: "Accès interdit" });
    }

    next();
  };
}

function authorizeSelfOrRoles(paramName, ...allowedRoles) {
  const roles = allowedRoles.map((r) => String(r).trim().toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const currentRole = String(req.user.role || "").trim().toLowerCase();
    const currentUserId = Number(req.user.id);
    const targetId = Number(req.params[paramName]);

    if (Number.isInteger(targetId) && currentUserId === targetId) {
      return next();
    }

    if (roles.includes(currentRole)) {
      return next();
    }

    return res.status(403).json({ message: "Accès interdit" });
  };
}

function authorizeBodyIdOrRoles(fieldName, ...allowedRoles) {
  const roles = allowedRoles.map((r) => String(r).trim().toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const currentRole = String(req.user.role || "").trim().toLowerCase();
    const currentUserId = Number(req.user.id);
    const targetId = Number(req.body[fieldName]);

    if (Number.isInteger(targetId) && currentUserId === targetId) {
      return next();
    }

    if (roles.includes(currentRole)) {
      return next();
    }

    return res.status(403).json({ message: "Accès interdit" });
  };
}

authMiddleware.authorizeRoles = authorizeRoles;
authMiddleware.authorizeSelfOrRoles = authorizeSelfOrRoles;
authMiddleware.authorizeBodyIdOrRoles = authorizeBodyIdOrRoles;

module.exports = authMiddleware;