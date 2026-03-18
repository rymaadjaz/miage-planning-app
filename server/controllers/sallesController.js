const ApiError = require("../utils/ApiError");
const salleModel = require("../models/salle.model");
const maintenanceModel = require("../models/maintenance.model");
const reservationModel = require("../models/reservation.model");
const historiqueService = require("../services/historique.service");

function toIso(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new ApiError(400, "Date invalide");
  }
  return d.toISOString();
}

exports.getAll = async (req, res) => {
  const filters = {
    type: req.query.type,
    capacityMin: req.query.capacityMin,
    pmr: req.query.pmr !== undefined ? req.query.pmr === "true" : undefined,
  };

  const rows = await salleModel.findAll(filters);
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id salle invalide");
  }

  const row = await salleModel.findById(id);
  if (!row) throw new ApiError(404, "Salle introuvable");

  res.json(row);
};

exports.create = async (req, res) => {
  const { code, capacite, type, accessibilitePMR = 0 } = req.body;

  const capaciteNum = Number(capacite);
  const typesValid = ["AMPHI", "TD", "TP", "LABO", "INFO"];

  if (!typesValid.includes(type)) {
    throw new ApiError(400, "Type de salle invalide");
  }

  if (!code || !Number.isInteger(capaciteNum) || capaciteNum <= 0) {
    throw new ApiError(400, "Champs invalides (code/capacite/type)");
  }

  const r = await salleModel.create({
    code,
    capacite: capaciteNum,
    type,
    accessibilitePMR: accessibilitePMR ? 1 : 0,
  });

  await historiqueService.logAction({
    auteur_id: req.user?.id ?? null,
    entite: "Salle",
    entite_id: r.lastID,
    action: "CREATE",
    detail: `Création de la salle ${code}`,
  });

  res.status(201).json({
    message: "Salle créée avec succès",
    id: r.lastID,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id salle invalide");
  }

  const existing = await salleModel.findById(id);
  if (!existing) throw new ApiError(404, "Salle introuvable");

  const typesValid = ["AMPHI", "TD", "TP", "LABO", "INFO"];

  const data = {
    code: req.body.code ?? existing.code,
    capacite:
      req.body.capacite !== undefined
        ? Number(req.body.capacite)
        : existing.capacite,
    type: req.body.type ?? existing.type,
    accessibilitePMR:
      req.body.accessibilitePMR !== undefined
        ? (req.body.accessibilitePMR ? 1 : 0)
        : existing.accessibilitePMR,
  };

  if (!typesValid.includes(data.type)) {
    throw new ApiError(400, "Type de salle invalide");
  }

  if (!data.code || !Number.isInteger(data.capacite) || data.capacite <= 0) {
    throw new ApiError(400, "Champs invalides");
  }

  await salleModel.update(id, data);

  await historiqueService.logAction({
    auteur_id: req.user?.id ?? null,
    entite: "Salle",
    entite_id: id,
    action: "UPDATE",
    detail: `Mise à jour de la salle ${data.code}`,
  });

  res.json({ message: "Salle mise à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id salle invalide");
  }

  const existing = await salleModel.findById(id);
  if (!existing) throw new ApiError(404, "Salle introuvable");

  const activeReservations = await reservationModel.findActiveReservationsBySalle(id);
  if (activeReservations.length > 0) {
    throw new ApiError(
      400,
      "La salle a des réservations actives, impossible de la désactiver."
    );
  }

  await salleModel.softDelete(id);

  await historiqueService.logAction({
    auteur_id: req.user?.id ?? null,
    entite: "Salle",
    entite_id: id,
    action: "DELETE",
    detail: `Désactivation de la salle ${existing.code}`,
  });

  res.json({ message: "Salle désactivée" });
};

exports.getMaintenance = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id salle invalide");
  }

  const salle = await salleModel.findById(id);
  if (!salle) throw new ApiError(404, "Salle introuvable");

  const rows = await maintenanceModel.findBySalle(id);
  res.json(rows);
};

exports.addMaintenance = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id salle invalide");
  }

  const salle = await salleModel.findById(id);
  if (!salle) throw new ApiError(404, "Salle introuvable");

  const { dateDebut, dateFin, description = "" } = req.body;

  const startIso = toIso(dateDebut);
  const endIso = toIso(dateFin);

  if (new Date(endIso) <= new Date(startIso)) {
    throw new ApiError(400, "dateFin doit être > dateDebut");
  }

  const overlap = await maintenanceModel.findOverlap(id, startIso, endIso);
  if (overlap) {
    throw new ApiError(409, "La salle est déjà en maintenance pendant cette période.");
  }

  const r = await maintenanceModel.create({
    salle_id: id,
    dateDebut: startIso,
    dateFin: endIso,
    description,
    statut: "PLANIFIEE",
  });

  await historiqueService.logAction({
    auteur_id: req.user?.id ?? null,
    entite: "MaintenanceSalle",
    entite_id: r.lastID,
    action: "CREATE",
    detail: `Ajout d'une maintenance sur la salle ${salle.code} du ${startIso} au ${endIso}`,
  });

  res.status(201).json({
    id: r.lastID,
    message: "Maintenance ajoutée avec succès",
  });
};