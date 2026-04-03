const ApiError = require("../utils/ApiError");
const etudiantModel = require("../models/etudiant.model");
const cohorteModel = require("../models/cohorte.model");
const { dbGet } = require("../db/dbAsync");

exports.getAll = async (_req, res) => {
  const rows = await etudiantModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id étudiant invalide");
  }

  const row = await etudiantModel.findById(id);
  if (!row) {
    throw new ApiError(404, "Étudiant introuvable");
  }

  res.json(row);
};

exports.create = async (req, res) => {
  const {
    id,
    numeroEtudiant,
    annee = null,
    filiere = null,
    cohorte_id = null,
  } = req.body;

  if (!id || !numeroEtudiant) {
    throw new ApiError(400, "Id utilisateur et numeroEtudiant requis");
  }

  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    throw new ApiError(400, "Id utilisateur invalide");
  }

  const user = await dbGet(
    `
    SELECT id, role
    FROM Utilisateur
    WHERE id = ?
    `,
    [userId]
  );

  if (!user) {
    throw new ApiError(404, "Utilisateur introuvable");
  }

  if (user.role !== "etudiant") {
    throw new ApiError(400, "Cet utilisateur n'a pas le rôle étudiant");
  }

  const existing = await etudiantModel.findById(userId);
  if (existing) {
    throw new ApiError(409, "Cet étudiant existe déjà");
  }

  if (cohorte_id) {
    const cohorte = await cohorteModel.findById(Number(cohorte_id));
    if (!cohorte) {
      throw new ApiError(404, "Cohorte introuvable");
    }
  }

  await etudiantModel.create({
    id: userId,
    numeroEtudiant: String(numeroEtudiant).trim(),
    annee: annee ? Number(annee) : null,
    filiere,
    cohorte_id: cohorte_id ? Number(cohorte_id) : null,
  });

  const created = await etudiantModel.findById(userId);

  res.status(201).json({
    message: "Étudiant créé avec succès",
    etudiant: created,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id étudiant invalide");
  }

  const existing = await etudiantModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Étudiant introuvable");
  }

  const finalNumero = req.body.numeroEtudiant ?? existing.numeroEtudiant;
  const finalAnnee = req.body.annee ?? existing.annee;
  const finalFiliere = req.body.filiere ?? existing.filiere;
  const finalCohorteId = req.body.cohorte_id ?? existing.cohorte_id;

  if (finalCohorteId) {
    const cohorte = await cohorteModel.findById(Number(finalCohorteId));
    if (!cohorte) {
      throw new ApiError(404, "Cohorte introuvable");
    }
  }

  await etudiantModel.update(id, {
    numeroEtudiant: String(finalNumero).trim(),
    annee: finalAnnee ? Number(finalAnnee) : null,
    filiere: finalFiliere,
    cohorte_id: finalCohorteId ? Number(finalCohorteId) : null,
  });

  const updated = await etudiantModel.findById(id);

  res.json({
    message: "Étudiant mis à jour",
    etudiant: updated,
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id étudiant invalide");
  }

  const existing = await etudiantModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Étudiant introuvable");
  }

  await etudiantModel.remove(id);

  res.json({
    message: "Étudiant supprimé",
    id,
  });
};