const ApiError = require("../utils/ApiError");
const disponibiliteModel = require("../models/disponibilite.model");

const JOURS_VALIDES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

exports.getAll = async (req, res) => {
  const rows = await disponibiliteModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id disponibilité invalide");

  const row = await disponibiliteModel.findById(id);
  if (!row) throw new ApiError(404, "Disponibilité introuvable");

  res.json(row);
};

exports.getByEnseignant = async (req, res) => {
  const enseignantId = Number(req.params.enseignantId);
  if (!Number.isInteger(enseignantId)) throw new ApiError(400, "Id enseignant invalide");

  const rows = await disponibiliteModel.findByEnseignant(enseignantId);
  res.json(rows);
};

exports.create = async (req, res) => {
  const { enseignant_id, jour, heureDebut, heureFin, disponible = 1 } = req.body;
  const enseignantId = Number(enseignant_id);

  if (!Number.isInteger(enseignantId) || !JOURS_VALIDES.includes(jour) || !heureDebut || !heureFin) {
    throw new ApiError(400, "Champs invalides");
  }

  const r = await disponibiliteModel.create({
    enseignant_id: enseignantId,
    jour,
    heureDebut,
    heureFin,
    disponible,
  });

  res.status(201).json({
    message: "Disponibilité créée avec succès",
    id: r.lastID,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id disponibilité invalide");

  const existing = await disponibiliteModel.findById(id);
  if (!existing) throw new ApiError(404, "Disponibilité introuvable");

  const data = {
    enseignant_id:
      req.body.enseignant_id !== undefined
        ? Number(req.body.enseignant_id)
        : existing.enseignant_id,
    jour: req.body.jour ?? existing.jour,
    heureDebut: req.body.heureDebut ?? existing.heureDebut,
    heureFin: req.body.heureFin ?? existing.heureFin,
    disponible:
      req.body.disponible !== undefined ? req.body.disponible : existing.disponible,
  };

  if (!Number.isInteger(data.enseignant_id) || !JOURS_VALIDES.includes(data.jour) || !data.heureDebut || !data.heureFin) {
    throw new ApiError(400, "Champs invalides");
  }

  await disponibiliteModel.update(id, data);
  res.json({ message: "Disponibilité mise à jour" });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Id disponibilité invalide");

  const existing = await disponibiliteModel.findById(id);
  if (!existing) throw new ApiError(404, "Disponibilité introuvable");

  await disponibiliteModel.remove(id);
  res.json({ message: "Disponibilité supprimée" });
};