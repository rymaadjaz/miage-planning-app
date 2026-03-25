const ApiError = require("../utils/ApiError");

module.exports = (requiredFields = []) => (req, res, next) => {
  for (const field of requiredFields) {
    if (req.body[field] === undefined || req.body[field] === null) {
      return next(new ApiError(400, `Champ manquant : ${field}`));
    }
  }

  next();
};