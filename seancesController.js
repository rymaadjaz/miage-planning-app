const ApiError = require("../utils/ApiError");
const seanceModel = require("../models/seance.model");
const cohorteModel = require("../models/cohorte.model");

exports.getAll = async (req, res) => {
  const rows = await seanceModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const row = await seanceModel.findById(Number(req.params.id));
  if (!row) throw new ApiError(404, "Séance introuvable");
  res.json(row);
};

exports.create = async (req, res) => {
  const { nom, type, duree_minutes = 90, enseignant_id, cohorte_id } = req.body;

  if (!nom || !type || !Number.isInteger(enseignant_id) || !Number.isInteger(cohorte_id)) {
    throw new ApiError(400, "Champs invalides (nom/type/enseignant_id/cohorte_id)");
  }

  const cohorte = await cohorteModel.findById(cohorte_id);
  if (!cohorte) throw new ApiError(404, "Cohorte introuvable");

  const r = await seanceModel.create({ nom, type, duree_minutes, enseignant_id, cohorte_id });
  res.status(201).json({ id: r.lastID });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const existing = await seanceModel.findById(id);
  if (!existing) throw new ApiError(404, "Séance introuvable");

  const { nom, type, duree_minutes, enseignant_id, cohorte_id } = req.body;

  if (cohorte_id !== undefined) {
    const cohorte = await cohorteModel.findById(cohorte_id);
    if (!cohorte) throw new ApiError(404, "Cohorte introuvable");
  }

  const data = {
    nom: nom ?? existing.nom,
    type: type ?? existing.type,
    duree_minutes: duree_minutes ?? existing.duree_minutes,
    enseignant_id: enseignant_id ?? existing.enseignant_id,
    cohorte_id: cohorte_id ?? existing.cohorte_id,
  };

  await seanceModel.update(id, data);
  res.json({ message: "Séance mise à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  const existing = await seanceModel.findById(id);
  if (!existing) throw new ApiError(404, "Séance introuvable");

  await seanceModel.softDelete(id);
  res.json({ message: "Séance désactivée (soft delete)" });
};