const ApiError = require("../utils/ApiError");

module.exports = (requiredFields = []) => (req, res, next) => {
  for (const f of requiredFields) {
    if (req.body[f] === undefined || req.body[f] === null) {
      return next(new ApiError(400, `Champ manquant : ${f}`));
    }
  }
  next();
};