const ApiError = require("../utils/ApiError");

function attachUser(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    req.user = null;
    return next();
  }
  req.user = { id: 1, role: "ADMIN" };
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return next(new ApiError(401, "Non authentifié (header Authorization manquant)"));
  next();
}

module.exports = { attachUser, requireAuth };