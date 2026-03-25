const ApiError = require("../utils/ApiError");
const equipementModel = require("../models/equipement.model");
const salleModel = require("../models/salle.model");

exports.getAll = async (req, res) => {
  const rows = await equipementModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id équipement invalide");

  const row = await equipementModel.findById(id);
  if (!row) throw new ApiError(404, "Équipement introuvable");

  res.json(row);
};

exports.getBySalle = async (req, res) => {
  const salleId = Number(req.params.salleId);
  if (!Number.isInteger(salleId)) throw new ApiError(400, "Id salle invalide");

  const salle = await salleModel.findById(salleId);
  if (!salle) throw new ApiError(404, "Salle introuvable");

  const rows = await equipementModel.findBySalle(salleId);
  res.json(rows);
};

exports.create = async (req, res) => {
  const { nom, salle_id } = req.body;
  const salleId = Number(salle_id);

  if (!nom || !Number.isInteger(salleId)) {
    throw new ApiError(400, "Champs invalides (nom/salle_id)");
  }

  const salle = await salleModel.findById(salleId);
  if (!salle) throw new ApiError(404, "Salle introuvable");

  const r = await equipementModel.create({ nom, salle_id: salleId });

  res.status(201).json({
    message: "Équipement créé avec succès",
    id: r.lastID,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id équipement invalide");

  const existing = await equipementModel.findById(id);
  if (!existing) throw new ApiError(404, "Équipement introuvable");

  const data = {
    nom: req.body.nom ?? existing.nom,
    salle_id:
      req.body.salle_id !== undefined ? Number(req.body.salle_id) : existing.salle_id,
  };

  if (!data.nom || !Number.isInteger(data.salle_id)) {
    throw new ApiError(400, "Champs invalides");
  }

  const salle = await salleModel.findById(data.salle_id);
  if (!salle) throw new ApiError(404, "Salle introuvable");

  await equipementModel.update(id, data);
  res.json({ message: "Équipement mis à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id équipement invalide");

  const existing = await equipementModel.findById(id);
  if (!existing) throw new ApiError(404, "Équipement introuvable");

  await equipementModel.remove(id);
  res.json({ message: "Équipement supprimé" });
};