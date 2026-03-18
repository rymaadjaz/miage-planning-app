const ApiError = require("../utils/ApiError");
const cohorteModel = require("../models/cohorte.model");
const historiqueService = require("../services/historique.service");

exports.getAll = async (req, res) => {
  const rows = await cohorteModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id cohorte invalide");
  }

  const row = await cohorteModel.findById(id);
  if (!row) throw new ApiError(404, "Cohorte introuvable");

  res.json(row);
};

exports.create = async (req, res) => {
  const { nom, effectif, niveau = null } = req.body;

  const effectifNum = Number(effectif);

  if (!nom || !Number.isInteger(effectifNum) || effectifNum < 0) {
    throw new ApiError(400, "Champs invalides (nom/effectif)");
  }

  const r = await cohorteModel.create({
    nom,
    effectif: effectifNum,
    niveau,
  });

  await historiqueService.logAction({
    auteur_id: req.user?.id ?? null,
    entite: "Cohorte",
    entite_id: r.lastID,
    action: "CREATE",
    detail: `Création de la cohorte ${nom}`,
  });

  res.status(201).json({
    message: "Cohorte créée avec succès",
    id: r.lastID,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id cohorte invalide");
  }

  const existing = await cohorteModel.findById(id);
  if (!existing) throw new ApiError(404, "Cohorte introuvable");

  const data = {
    nom: req.body.nom ?? existing.nom,
    effectif:
      req.body.effectif !== undefined
        ? Number(req.body.effectif)
        : existing.effectif,
    niveau: req.body.niveau ?? existing.niveau,
  };

  if (!data.nom || !Number.isInteger(data.effectif) || data.effectif < 0) {
    throw new ApiError(400, "Champs invalides (nom/effectif)");
  }

  await cohorteModel.update(id, data);

  await historiqueService.logAction({
    auteur_id: req.user?.id ?? null,
    entite: "Cohorte",
    entite_id: id,
    action: "UPDATE",
    detail: `Mise à jour de la cohorte ${data.nom}`,
  });

  res.json({ message: "Cohorte mise à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id cohorte invalide");
  }

  const existing = await cohorteModel.findById(id);
  if (!existing) throw new ApiError(404, "Cohorte introuvable");

  await cohorteModel.remove(id);

  await historiqueService.logAction({
    auteur_id: req.user?.id ?? null,
    entite: "Cohorte",
    entite_id: id,
    action: "DELETE",
    detail: `Suppression de la cohorte ${existing.nom}`,
  });

  res.json({ message: "Cohorte supprimée" });
};