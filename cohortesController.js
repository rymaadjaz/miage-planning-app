const ApiError = require("../utils/ApiError");
const cohorteModel = require("../models/cohorte.model");

exports.getAll = async (req, res) => {
  const rows = await cohorteModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const row = await cohorteModel.findById(Number(req.params.id));
  if (!row) throw new ApiError(404, "Cohorte introuvable");
  res.json(row);
};

exports.create = async (req, res) => {
  const { nom, annee, filiere = null, specialite = null, effectif, parent_id = null } = req.body;

  if (!nom || !Number.isInteger(annee) || annee <= 0 || !Number.isInteger(effectif) || effectif <= 0) {
    throw new ApiError(400, "Champs invalides (nom/annee/effectif)");
  }

  const r = await cohorteModel.create({ nom, annee, filiere, specialite, effectif, parent_id });
  res.status(201).json({ id: r.lastID });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const existing = await cohorteModel.findById(id);
  if (!existing) throw new ApiError(404, "Cohorte introuvable");

  const { nom, annee, filiere, specialite, effectif, parent_id } = req.body;
  const data = {
    nom: nom ?? existing.nom,
    annee: annee ?? existing.annee,
    filiere: filiere ?? existing.filiere,
    specialite: specialite ?? existing.specialite,
    effectif: effectif ?? existing.effectif,
    parent_id: parent_id ?? existing.parent_id,
  };

  await cohorteModel.update(id, data);
  res.json({ message: "Cohorte mise à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  const existing = await cohorteModel.findById(id);
  if (!existing) throw new ApiError(404, "Cohorte introuvable");

  await cohorteModel.softDelete(id);
  res.json({ message: "Cohorte désactivée (soft delete)" });
};