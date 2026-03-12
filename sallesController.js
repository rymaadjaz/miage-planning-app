const ApiError = require("../utils/ApiError");
const salleModel = require("../models/salle.model");
const maintenanceModel = require("../models/maintenance.model");
const reservationModel = require("../models/reservation.model");

function toIso(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, "Date invalide ");
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
  const row = await salleModel.findById(Number(req.params.id));
  if (!row) throw new ApiError(404, "Salle introuvable");
  res.json(row);
};

exports.create = async (req, res) => {
  const { nom, capacite, type, accessiblePMR = 0 } = req.body;

  // Validation du type de salle
  const typesValid = ["AMPHI", "TD", "TP", "LABO", "INFO"];
  if (!typesValid.includes(type)) {
    throw new ApiError(400, "Type de salle invalide");
  }

  if (!nom || !type || !Number.isInteger(capacite) || capacite <= 0) {
    throw new ApiError(400, "Champs invalides (nom/capacite/type)");
  }

  const r = await salleModel.create({ nom, capacite, type, accessiblePMR });
  console.log(`Salle créée : ${nom}, capacité: ${capacite}, type: ${type}`);
  res.status(201).json({ id: r.lastID });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const existing = await salleModel.findById(id);
  if (!existing) throw new ApiError(404, "Salle introuvable");

  const { nom, capacite, type, accessiblePMR } = req.body;

  // Validation du type de salle
  const typesValid = ["AMPHI", "TD", "TP", "LABO", "INFO"];
  if (type && !typesValid.includes(type)) {
    throw new ApiError(400, "Type de salle invalide");
  }

  const data = {
    nom: nom ?? existing.nom,
    capacite: capacite ?? existing.capacite,
    type: type ?? existing.type,
    accessiblePMR: accessiblePMR ?? existing.accessiblePMR,
  };

  await salleModel.update(id, data);
  console.log(`Salle mise à jour : ${id}`);
  res.json({ message: "Salle mise à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  const existing = await salleModel.findById(id);
  if (!existing) throw new ApiError(404, "Salle introuvable");

  // Vérifier les réservations actives avant de supprimer
  const activeReservations = await reservationModel.findActiveReservationsBySalle(id);
  if (activeReservations.length > 0) {
    throw new ApiError(400, "La salle a des réservations actives, impossible de la désactiver.");
  }

  await salleModel.softDelete(id);
  console.log(`Salle désactivée : ${id}`);
  res.json({ message: "Salle désactivée" });
};

exports.getMaintenance = async (req, res) => {
  const id = Number(req.params.id);
  const salle = await salleModel.findById(id);
  if (!salle) throw new ApiError(404, "Salle introuvable");

  const rows = await maintenanceModel.findBySalle(id);
  res.json(rows);
};

exports.addMaintenance = async (req, res) => {
  const id = Number(req.params.id);
  const salle = await salleModel.findById(id);
  if (!salle) throw new ApiError(404, "Salle introuvable");

  const { date_debut, date_fin, description = "" } = req.body;

  // Vérification de la date de début et de fin
  const startIso = toIso(date_debut);
  const endIso = toIso(date_fin);
  if (new Date(endIso) <= new Date(startIso)) throw new ApiError(400, "date_fin doit être > date_debut");

  // Vérifier si la salle est disponible pendant la maintenance
  const maintenanceOverlap = await maintenanceModel.findOverlap(id, startIso, endIso);
  if (maintenanceOverlap) {
    throw new ApiError(409, "La salle est déjà en maintenance pendant cette période.");
  }

  const r = await maintenanceModel.create({
    salle_id: id,
    date_debut: startIso,
    date_fin: endIso,
    description,
    statut: "PLANNED",
  });

  console.log(`Maintenance ajoutée pour la salle : ${id}, du ${startIso} au ${endIso}`);
  res.status(201).json({ id: r.lastID, message: "Maintenance ajoutée avec succès" });
};