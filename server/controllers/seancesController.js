const ApiError = require("../utils/ApiError");
const seanceModel = require("../models/seance.model");
const cohorteModel = require("../models/cohorte.model");
const historiqueService = require("../services/historique.service");

exports.getAll = async (req, res) => {
  const rows = await seanceModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id séance invalide");
  }

  const row = await seanceModel.findById(id);
  if (!row) throw new ApiError(404, "Séance introuvable");

  res.json(row);
};

exports.create = async (req, res) => {
  const {
    dateSeance,
    heureDebut,
    duree,
    typeSeance,
    statut = "PLANIFIE",
    matiere_id = null,
    cohorte_id,
    enseignant_id,
  } = req.body;

  const dureeNum = Number(duree);
  const cohorteIdNum = Number(cohorte_id);
  const enseignantIdNum = Number(enseignant_id);
  const matiereIdNum =
    matiere_id !== null && matiere_id !== undefined ? Number(matiere_id) : null;

  const typesValid = ["CM", "TD", "TP", "EXAMEN", "EVENEMENT", "REUNION"];
  const statutsValid = ["PLANIFIE", "VALIDE", "ANNULE"];

  if (
    !dateSeance ||
    !heureDebut ||
    !Number.isInteger(dureeNum) ||
    dureeNum <= 0 ||
    !Number.isInteger(cohorteIdNum) ||
    !Number.isInteger(enseignantIdNum)
  ) {
    throw new ApiError(400, "Champs invalides");
  }

  if (matiereIdNum !== null && !Number.isInteger(matiereIdNum)) {
    throw new ApiError(400, "matiere_id invalide");
  }

  if (!typesValid.includes(typeSeance)) {
    throw new ApiError(400, "Type de séance invalide");
  }

  if (!statutsValid.includes(statut)) {
    throw new ApiError(400, "Statut de séance invalide");
  }

  const cohorte = await cohorteModel.findById(cohorteIdNum);
  if (!cohorte) throw new ApiError(404, "Cohorte introuvable");

  const r = await seanceModel.create({
    dateSeance,
    heureDebut,
    duree: dureeNum,
    typeSeance,
    statut,
    matiere_id: matiereIdNum,
    cohorte_id: cohorteIdNum,
    enseignant_id: enseignantIdNum,
  });

  await historiqueService.logAction({
    auteur_id: req.user?.id ?? null,
    entite: "Seance",
    entite_id: r.lastID,
    action: "CREATE",
    detail: `Création de la séance ${typeSeance} le ${dateSeance} à ${heureDebut}`,
  });

  res.status(201).json({
    message: "Séance créée avec succès",
    id: r.lastID,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id séance invalide");
  }

  const existing = await seanceModel.findById(id);
  if (!existing) throw new ApiError(404, "Séance introuvable");

  const typesValid = ["CM", "TD", "TP", "EXAMEN", "EVENEMENT", "REUNION"];
  const statutsValid = ["PLANIFIE", "VALIDE", "ANNULE"];

  const matiereIdNum =
    req.body.matiere_id !== undefined && req.body.matiere_id !== null
      ? Number(req.body.matiere_id)
      : existing.matiere_id;

  const data = {
    dateSeance: req.body.dateSeance ?? existing.dateSeance,
    heureDebut: req.body.heureDebut ?? existing.heureDebut,
    duree:
      req.body.duree !== undefined ? Number(req.body.duree) : existing.duree,
    typeSeance: req.body.typeSeance ?? existing.typeSeance,
    statut: req.body.statut ?? existing.statut,
    matiere_id: matiereIdNum,
    cohorte_id:
      req.body.cohorte_id !== undefined
        ? Number(req.body.cohorte_id)
        : existing.cohorte_id,
    enseignant_id:
      req.body.enseignant_id !== undefined
        ? Number(req.body.enseignant_id)
        : existing.enseignant_id,
  };

  if (!Number.isInteger(data.duree) || data.duree <= 0) {
    throw new ApiError(400, "Durée invalide");
  }

  if (data.matiere_id !== null && !Number.isInteger(data.matiere_id)) {
    throw new ApiError(400, "matiere_id invalide");
  }

  if (!Number.isInteger(data.cohorte_id)) {
    throw new ApiError(400, "cohorte_id invalide");
  }

  if (!Number.isInteger(data.enseignant_id)) {
    throw new ApiError(400, "enseignant_id invalide");
  }

  if (!typesValid.includes(data.typeSeance)) {
    throw new ApiError(400, "Type de séance invalide");
  }

  if (!statutsValid.includes(data.statut)) {
    throw new ApiError(400, "Statut de séance invalide");
  }

  const cohorte = await cohorteModel.findById(data.cohorte_id);
  if (!cohorte) throw new ApiError(404, "Cohorte introuvable");

  await seanceModel.update(id, data);

  await historiqueService.logAction({
    auteur_id: req.user?.id ?? null,
    entite: "Seance",
    entite_id: id,
    action: "UPDATE",
    detail: `Mise à jour de la séance ${id}`,
  });

  res.json({ message: "Séance mise à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id séance invalide");
  }

  const existing = await seanceModel.findById(id);
  if (!existing) throw new ApiError(404, "Séance introuvable");

  await seanceModel.cancel(id);

  await historiqueService.logAction({
    auteur_id: req.user?.id ?? null,
    entite: "Seance",
    entite_id: id,
    action: "CANCEL",
    detail: `Annulation de la séance ${id}`,
  });

  res.json({ message: "Séance annulée" });
};