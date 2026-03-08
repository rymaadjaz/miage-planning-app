const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: "Accès refusé" });

  try {
    const verified = jwt.verify(token, 'SECRET_KEY_MIAGE');
    req.user = verified;
    next(); // On laisse passer vers le contrôleur
  } catch (err) {
    res.status(400).json({ message: "Token invalide" });
  }
};