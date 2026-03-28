const ApiError = require("../utils/ApiError");
const conflitModel = require("../models/conflit.model");

exports.getAll = async (_req, res) => {
  const rows = await conflitModel.findAll();
  res.json(rows);
};

exports.getUnresolved = async (_req, res) => {
  const rows = await conflitModel.findUnresolved();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id conflit invalide");
  }

  const row = await conflitModel.findById(id);

  if (!row) {
    throw new ApiError(404, "Conflit introuvable");
  }

  res.json(row);
};

exports.resolve = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id conflit invalide");
  }

  const existing = await conflitModel.findById(id);

  if (!existing) {
    throw new ApiError(404, "Conflit introuvable");
  }

  await conflitModel.markResolved(id);

  res.json({
    message: "Conflit marqué comme résolu",
    id,
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id conflit invalide");
  }

  const existing = await conflitModel.findById(id);

  if (!existing) {
    throw new ApiError(404, "Conflit introuvable");
  }

  await conflitModel.remove(id);

  res.json({
    message: "Conflit supprimé",
    id,
  });
};