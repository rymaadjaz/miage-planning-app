const ApiError = require("../utils/ApiError");
const enseignantModel = require("../models/enseignant.model");

exports.getAll = async (req, res) => {
  const rows = await enseignantModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id enseignant invalide");

  const row = await enseignantModel.findById(id);
  if (!row) throw new ApiError(404, "Enseignant introuvable");

  res.json(row);
};

exports.create = async (req, res) => {
  const { id, grade = null, service = null } = req.body;
  const userId = Number(id);

  if (!Number.isInteger(userId)) {
    throw new ApiError(400, "Id utilisateur invalide");
  }

  const r = await enseignantModel.create({ id: userId, grade, service });
  res.status(201).json({ message: "Enseignant créé", id: r.lastID });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id enseignant invalide");

  const existing = await enseignantModel.findById(id);
  if (!existing) throw new ApiError(404, "Enseignant introuvable");

  const data = {
    grade: req.body.grade ?? existing.grade,
    service: req.body.service ?? existing.service,
  };

  await enseignantModel.update(id, data);
  res.json({ message: "Enseignant mis à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id enseignant invalide");

  const existing = await enseignantModel.findById(id);
  if (!existing) throw new ApiError(404, "Enseignant introuvable");

  await enseignantModel.remove(id);
  res.json({ message: "Enseignant supprimé" });
};