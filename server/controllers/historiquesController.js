const ApiError = require("../utils/ApiError");
const historiqueModel = require("../models/historique.model");

exports.getAll = async (_req, res) => {
  const rows = await historiqueModel.findAll();
  res.json(rows);
};

exports.getByEntity = async (req, res) => {
  const { entite, entite_id } = req.query;

  if (!entite || !entite_id) {
    throw new ApiError(400, "Les paramètres entite et entite_id sont requis");
  }

  const entityId = Number(entite_id);

  if (!Number.isInteger(entityId)) {
    throw new ApiError(400, "entite_id invalide");
  }

  const rows = await historiqueModel.findByEntity(String(entite).trim(), entityId);
  res.json(rows);
};