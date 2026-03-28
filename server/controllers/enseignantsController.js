const ApiError = require("../utils/ApiError");
const enseignantModel = require("../models/enseignant.model");
const { dbGet } = require("../db/dbAsync");

exports.getAll = async (_req, res) => {
  const rows = await enseignantModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id enseignant invalide");
  }

  const row = await enseignantModel.findById(id);
  if (!row) {
    throw new ApiError(404, "Enseignant introuvable");
  }

  res.json(row);
};

exports.create = async (req, res) => {
  const { id, grade = null, service = null } = req.body;

  if (!id) {
    throw new ApiError(400, "Id utilisateur requis");
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

  if (user.role !== "enseignant") {
    throw new ApiError(400, "Cet utilisateur n'a pas le rôle enseignant");
  }

  const existing = await enseignantModel.findById(userId);
  if (existing) {
    throw new ApiError(409, "Cet enseignant existe déjà");
  }

  await enseignantModel.create({
    id: userId,
    grade,
    service,
  });

  const created = await enseignantModel.findById(userId);

  res.status(201).json({
    message: "Enseignant créé avec succès",
    enseignant: created,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id enseignant invalide");
  }

  const existing = await enseignantModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Enseignant introuvable");
  }

  const finalGrade = req.body.grade ?? existing.grade;
  const finalService = req.body.service ?? existing.service;

  await enseignantModel.update(id, {
    grade: finalGrade,
    service: finalService,
  });

  const updated = await enseignantModel.findById(id);

  res.json({
    message: "Enseignant mis à jour",
    enseignant: updated,
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id enseignant invalide");
  }

  const existing = await enseignantModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Enseignant introuvable");
  }

  await enseignantModel.remove(id);

  res.json({
    message: "Enseignant supprimé",
    id,
  });
};