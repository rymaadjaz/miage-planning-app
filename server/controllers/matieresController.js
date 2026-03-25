const ApiError = require("../utils/ApiError");
const matiereModel = require("../models/matiere.model");

exports.getAll = async (req, res) => {
  const rows = await matiereModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id matière invalide");

  const row = await matiereModel.findById(id);
  if (!row) throw new ApiError(404, "Matière introuvable");

  res.json(row);
};

exports.create = async (req, res) => {
  const { nom, volumeHoraireTotal = 0 } = req.body;

  const volume = Number(volumeHoraireTotal);

  if (!nom || !Number.isInteger(volume) || volume < 0) {
    throw new ApiError(400, "Champs invalides (nom/volumeHoraireTotal)");
  }

  const r = await matiereModel.create({
    nom,
    volumeHoraireTotal: volume,
  });

  res.status(201).json({
    message: "Matière créée avec succès",
    id: r.lastID,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id matière invalide");

  const existing = await matiereModel.findById(id);
  if (!existing) throw new ApiError(404, "Matière introuvable");

  const data = {
    nom: req.body.nom ?? existing.nom,
    volumeHoraireTotal:
      req.body.volumeHoraireTotal !== undefined
        ? Number(req.body.volumeHoraireTotal)
        : existing.volumeHoraireTotal,
  };

  if (!data.nom || !Number.isInteger(data.volumeHoraireTotal) || data.volumeHoraireTotal < 0) {
    throw new ApiError(400, "Champs invalides");
  }

  await matiereModel.update(id, data);
  res.json({ message: "Matière mise à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id matière invalide");

  const existing = await matiereModel.findById(id);
  if (!existing) throw new ApiError(404, "Matière introuvable");

  await matiereModel.remove(id);
  res.json({ message: "Matière supprimée" });
};