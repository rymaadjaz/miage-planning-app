const ApiError = require("../utils/ApiError");
const historiqueModel = require("../models/historique.model");

exports.getAll = async (req, res) => {
  const rows = await historiqueModel.findAll();
  res.json(rows);
};

exports.getByEntity = async (req, res) => {
  const { entite, entite_id } = req.params;
  const entityId = Number(entite_id);

  if (!entite || !Number.isInteger(entityId)) {
    throw new ApiError(400, "Paramètres invalides");
  }

  const rows = await historiqueModel.findByEntity(entite, entityId);
  res.json(rows);
};