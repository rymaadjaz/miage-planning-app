const ApiError = require("../utils/ApiError");
const salleModel = require("../models/salle.model");

const TYPES_VALIDES = ["AMPHI", "TD", "TP", "LABO", "INFO"];

function normalizeSalleType(type) {
  return String(type || "").trim().toUpperCase();
}

exports.getAll = async (_req, res) => {
  const rows = await salleModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id salle invalide");
  }

  const row = await salleModel.findById(id);
  if (!row) {
    throw new ApiError(404, "Salle introuvable");
  }

  res.json(row);
};

exports.create = async (req, res) => {
  const {
    code,
    capacite,
    type,
    accessibilitePMR = 0,
    isActive = 1,
  } = req.body;

  if (!code || !capacite || !type) {
    throw new ApiError(400, "Champs requis manquants");
  }

  const finalType = normalizeSalleType(type);
  if (!TYPES_VALIDES.includes(finalType)) {
    throw new ApiError(400, "Type de salle invalide");
  }

  const existing = await salleModel.findByCode(String(code).trim());
  if (existing) {
    throw new ApiError(409, "Ce code salle existe déjà");
  }

  const result = await salleModel.create({
    code: String(code).trim(),
    capacite: Number(capacite),
    type: finalType,
    accessibilitePMR: accessibilitePMR ? 1 : 0,
    isActive: isActive ? 1 : 0,
  });

  const created = await salleModel.findById(result.lastID);

  res.status(201).json({
    message: "Salle créée avec succès",
    salle: created,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id salle invalide");
  }

  const existing = await salleModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Salle introuvable");
  }

  const finalCode = req.body.code ?? existing.code;
  const finalCapacite = req.body.capacite ?? existing.capacite;
  const finalType = req.body.type ? normalizeSalleType(req.body.type) : existing.type;
  const finalPMR = req.body.accessibilitePMR ?? existing.accessibilitePMR;
  const finalIsActive = req.body.isActive ?? existing.isActive;

  if (!TYPES_VALIDES.includes(finalType)) {
    throw new ApiError(400, "Type de salle invalide");
  }

  const duplicate = await salleModel.findByCode(String(finalCode).trim());
  if (duplicate && duplicate.id !== id) {
    throw new ApiError(409, "Une autre salle porte déjà ce code");
  }

  await salleModel.update(id, {
    code: String(finalCode).trim(),
    capacite: Number(finalCapacite),
    type: finalType,
    accessibilitePMR: finalPMR ? 1 : 0,
    isActive: finalIsActive ? 1 : 0,
  });

  const updated = await salleModel.findById(id);

  res.json({
    message: "Salle mise à jour",
    salle: updated,
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id salle invalide");
  }

  const existing = await salleModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Salle introuvable");
  }

  await salleModel.remove(id);

  res.json({
    message: "Salle supprimée",
    id,
  });
};