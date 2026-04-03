const ApiError = require("../utils/ApiError");
const seanceModel = require("../models/seance.model");
const cohorteModel = require("../models/cohorte.model");
const { dbGet } = require("../db/dbAsync");

const TYPES_VALIDES = ["CM", "TD", "TP", "EXAMEN", "EVENEMENT", "REUNION"];
const STATUTS_VALIDES = ["PLANIFIE", "VALIDE", "ANNULE"];

function normalizeType(type) {
  return String(type || "").trim().toUpperCase();
}

function normalizeStatut(statut) {
  return String(statut || "").trim().toUpperCase();
}

async function utilisateurExiste(id) {
  return dbGet(
    `
    SELECT id
    FROM Utilisateur
    WHERE id = ?
    `,
    [id]
  );
}

async function matiereExiste(id) {
  return dbGet(
    `
    SELECT id
    FROM Matiere
    WHERE id = ?
    `,
    [id]
  );
}

exports.getAll = async (_req, res) => {
  const rows = await seanceModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id séance invalide");
  }

  const row = await seanceModel.findById(id);
  if (!row) {
    throw new ApiError(404, "Séance introuvable");
  }

  res.json(row);
};

exports.create = async (req, res) => {
  const {
    dateSeance,
    heureDebut,
    duree,
    typeSeance,
    statut = "PLANIFIE",
    description = null,
    matiere_id = null,
    cohorte_id = null,
    enseignant_id = null,
  } = req.body;

  if (!dateSeance || !heureDebut || !duree || !typeSeance) {
    throw new ApiError(400, "Champs requis manquants");
  }

  const finalType = normalizeType(typeSeance);
  const finalStatut = normalizeStatut(statut);

  if (!TYPES_VALIDES.includes(finalType)) {
    throw new ApiError(400, "Type de séance invalide");
  }

  if (!STATUTS_VALIDES.includes(finalStatut)) {
    throw new ApiError(400, "Statut de séance invalide");
  }

  if (cohorte_id) {
    const cohorte = await cohorteModel.findById(Number(cohorte_id));
    if (!cohorte) {
      throw new ApiError(404, "Cohorte introuvable");
    }
  }

  if (enseignant_id) {
    const enseignant = await utilisateurExiste(Number(enseignant_id));
    if (!enseignant) {
      throw new ApiError(404, "Enseignant introuvable");
    }
  }

  if (matiere_id) {
    const matiere = await matiereExiste(Number(matiere_id));
    if (!matiere) {
      throw new ApiError(404, "Matière introuvable");
    }
  }

  const result = await seanceModel.create({
    dateSeance,
    heureDebut,
    duree: Number(duree),
    typeSeance: finalType,
    statut: finalStatut,
    description,
    matiere_id: matiere_id ? Number(matiere_id) : null,
    cohorte_id: cohorte_id ? Number(cohorte_id) : null,
    enseignant_id: enseignant_id ? Number(enseignant_id) : null,
  });

  const created = await seanceModel.findById(result.lastID);

  res.status(201).json({
    message: "Séance créée avec succès",
    seance: created,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id séance invalide");
  }

  const existing = await seanceModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Séance introuvable");
  }

  const finalDateSeance = req.body.dateSeance ?? existing.dateSeance;
  const finalHeureDebut = req.body.heureDebut ?? existing.heureDebut;
  const finalDuree = req.body.duree ?? existing.duree;
  const finalType = req.body.typeSeance ? normalizeType(req.body.typeSeance) : existing.typeSeance;
  const finalStatut = req.body.statut ? normalizeStatut(req.body.statut) : existing.statut;
  const finalDescription = req.body.description ?? existing.description;
  const finalMatiereId = req.body.matiere_id ?? existing.matiere_id;
  const finalCohorteId = req.body.cohorte_id ?? existing.cohorte_id;
  const finalEnseignantId = req.body.enseignant_id ?? existing.enseignant_id;

  if (!TYPES_VALIDES.includes(finalType)) {
    throw new ApiError(400, "Type de séance invalide");
  }

  if (!STATUTS_VALIDES.includes(finalStatut)) {
    throw new ApiError(400, "Statut de séance invalide");
  }

  if (finalCohorteId) {
    const cohorte = await cohorteModel.findById(Number(finalCohorteId));
    if (!cohorte) {
      throw new ApiError(404, "Cohorte introuvable");
    }
  }

  if (finalEnseignantId) {
    const enseignant = await utilisateurExiste(Number(finalEnseignantId));
    if (!enseignant) {
      throw new ApiError(404, "Enseignant introuvable");
    }
  }

  if (finalMatiereId) {
    const matiere = await matiereExiste(Number(finalMatiereId));
    if (!matiere) {
      throw new ApiError(404, "Matière introuvable");
    }
  }

  await seanceModel.update(id, {
    dateSeance: finalDateSeance,
    heureDebut: finalHeureDebut,
    duree: Number(finalDuree),
    typeSeance: finalType,
    statut: finalStatut,
    description: finalDescription,
    matiere_id: finalMatiereId ? Number(finalMatiereId) : null,
    cohorte_id: finalCohorteId ? Number(finalCohorteId) : null,
    enseignant_id: finalEnseignantId ? Number(finalEnseignantId) : null,
  });

  const updated = await seanceModel.findById(id);

  res.json({
    message: "Séance mise à jour",
    seance: updated,
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id séance invalide");
  }

  const existing = await seanceModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Séance introuvable");
  }

  await seanceModel.remove(id);

  res.json({
    message: "Séance supprimée",
    id,
  });
};