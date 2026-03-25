const ApiError = require("../utils/ApiError");
const conflitModel = require("../models/conflit.model");

exports.getAll = async (req, res) => {
  const rows = await conflitModel.findAll();
  res.json(rows);
};

exports.getOpen = async (req, res) => {
  const rows = await conflitModel.findOpen();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id conflit invalide");

  const row = await conflitModel.findById(id);
  if (!row) throw new ApiError(404, "Conflit introuvable");

  res.json(row);
};

exports.create = async (req, res) => {
  const { type, description, reservation_id = null, seance_id_1 = null, seance_id_2 = null } = req.body;

  if (!type || !description) {
    throw new ApiError(400, "Champs invalides (type/description)");
  }

  const r = await conflitModel.create({
    type,
    description,
    reservation_id,
    seance_id_1,
    seance_id_2,
  });

  res.status(201).json({
    message: "Conflit créé avec succès",
    id: r.lastID,
  });
};

exports.resolve = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id conflit invalide");

  const existing = await conflitModel.findById(id);
  if (!existing) throw new ApiError(404, "Conflit introuvable");

  await conflitModel.resolve(id);
  res.json({ message: "Conflit marqué comme résolu" });
};