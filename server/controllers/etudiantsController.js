const ApiError = require("../utils/ApiError");
const etudiantModel = require("../models/etudiant.model");

exports.getAll = async (req, res) => {
  const rows = await etudiantModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id étudiant invalide");

  const row = await etudiantModel.findById(id);
  if (!row) throw new ApiError(404, "Étudiant introuvable");

  res.json(row);
};

exports.create = async (req, res) => {
  const { id, numeroEtudiant, annee = null, filiere = null, cohorte_id = null } = req.body;
  const userId = Number(id);

  if (!Number.isInteger(userId) || !numeroEtudiant) {
    throw new ApiError(400, "Champs invalides");
  }

  const r = await etudiantModel.create({
    id: userId,
    numeroEtudiant,
    annee,
    filiere,
    cohorte_id,
  });

  res.status(201).json({ message: "Étudiant créé", id: r.lastID });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id étudiant invalide");

  const existing = await etudiantModel.findById(id);
  if (!existing) throw new ApiError(404, "Étudiant introuvable");

  const data = {
    numeroEtudiant: req.body.numeroEtudiant ?? existing.numeroEtudiant,
    annee: req.body.annee ?? existing.annee,
    filiere: req.body.filiere ?? existing.filiere,
    cohorte_id: req.body.cohorte_id ?? existing.cohorte_id,
  };

  await etudiantModel.update(id, data);
  res.json({ message: "Étudiant mis à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id étudiant invalide");

  const existing = await etudiantModel.findById(id);
  if (!existing) throw new ApiError(404, "Étudiant introuvable");

  await etudiantModel.remove(id);
  res.json({ message: "Étudiant supprimé" });
};