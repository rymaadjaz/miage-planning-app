const ApiError = require("../utils/ApiError");
const disponibiliteModel = require("../models/disponibilite.model");
const { dbGet } = require("../db/dbAsync");

const JOURS_VALIDES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(String(value || ""));
}

exports.getByEnseignantId = async (req, res) => {
  const enseignantId = Number(req.params.id);

  if (!Number.isInteger(enseignantId)) {
    throw new ApiError(400, "Id enseignant invalide");
  }

  const enseignant = await dbGet(
    `
    SELECT id
    FROM Enseignant
    WHERE id = ?
    `,
    [enseignantId]
  );

  if (!enseignant) {
    throw new ApiError(404, "Enseignant introuvable");
  }

  const rows = await disponibiliteModel.findByEnseignantId(enseignantId);
  res.json(rows);
};

exports.create = async (req, res) => {
  const {
    enseignant_id,
    jour,
    heureDebut,
    heureFin,
    disponible = 1,
  } = req.body;

  if (!enseignant_id || !jour || !heureDebut || !heureFin) {
    throw new ApiError(400, "Champs requis manquants");
  }

  const enseignantId = Number(enseignant_id);

  if (!Number.isInteger(enseignantId)) {
    throw new ApiError(400, "enseignant_id invalide");
  }

  if (!JOURS_VALIDES.includes(String(jour).trim())) {
    throw new ApiError(400, "Jour invalide");
  }

  if (!isValidTime(heureDebut) || !isValidTime(heureFin)) {
    throw new ApiError(400, "Format d'heure invalide");
  }

  if (heureFin <= heureDebut) {
    throw new ApiError(400, "heureFin doit être après heureDebut");
  }

  const enseignant = await dbGet(
    `
    SELECT id
    FROM Enseignant
    WHERE id = ?
    `,
    [enseignantId]
  );

  if (!enseignant) {
    throw new ApiError(404, "Enseignant introuvable");
  }

  const result = await disponibiliteModel.create({
    enseignant_id: enseignantId,
    jour: String(jour).trim(),
    heureDebut: String(heureDebut).trim(),
    heureFin: String(heureFin).trim(),
    disponible: disponible ? 1 : 0,
  });

  const created = await disponibiliteModel.findById(result.lastID);

  res.status(201).json({
    message: "Disponibilité créée avec succès",
    disponibilite: created,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id disponibilité invalide");
  }

  const existing = await disponibiliteModel.findById(id);

  if (!existing) {
    throw new ApiError(404, "Disponibilité introuvable");
  }

  const finalEnseignantId = req.body.enseignant_id ?? existing.enseignant_id;
  const finalJour = req.body.jour ?? existing.jour;
  const finalHeureDebut = req.body.heureDebut ?? existing.heureDebut;
  const finalHeureFin = req.body.heureFin ?? existing.heureFin;
  const finalDisponible = req.body.disponible ?? existing.disponible;

  if (!JOURS_VALIDES.includes(String(finalJour).trim())) {
    throw new ApiError(400, "Jour invalide");
  }

  if (!isValidTime(finalHeureDebut) || !isValidTime(finalHeureFin)) {
    throw new ApiError(400, "Format d'heure invalide");
  }

  if (finalHeureFin <= finalHeureDebut) {
    throw new ApiError(400, "heureFin doit être après heureDebut");
  }

  const enseignant = await dbGet(
    `
    SELECT id
    FROM Enseignant
    WHERE id = ?
    `,
    [Number(finalEnseignantId)]
  );

  if (!enseignant) {
    throw new ApiError(404, "Enseignant introuvable");
  }

  await disponibiliteModel.update(id, {
    enseignant_id: Number(finalEnseignantId),
    jour: String(finalJour).trim(),
    heureDebut: String(finalHeureDebut).trim(),
    heureFin: String(finalHeureFin).trim(),
    disponible: finalDisponible ? 1 : 0,
  });

  const updated = await disponibiliteModel.findById(id);

  res.json({
    message: "Disponibilité mise à jour",
    disponibilite: updated,
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id disponibilité invalide");
  }

  const existing = await disponibiliteModel.findById(id);

  if (!existing) {
    throw new ApiError(404, "Disponibilité introuvable");
  }

  await disponibiliteModel.remove(id);

  res.json({
    message: "Disponibilité supprimée",
    id,
  });
};