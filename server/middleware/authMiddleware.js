const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const auth = req.header("Authorization");

  if (!auth) {
    return res.status(401).json({ message: "Accès refusé" });
  }

  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : auth.trim();

  try {
    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET || "SECRET_KEY_MIAGE"
    );
    req.user = verified;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Token invalide" });
  }
};