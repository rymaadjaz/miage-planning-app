const ApiError = require("../utils/ApiError");
const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.getAll = async (_req, res) => {
  const rows = await dbAll(`
    SELECT
      e.id,
      e.nom,
      e.salle_id,
      s.code AS salle_code
    FROM Equipement e
    LEFT JOIN Salle s ON e.salle_id = s.id
    ORDER BY e.nom ASC
  `);

  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id équipement invalide");
  }

  const row = await dbGet(
    `
    SELECT
      e.id,
      e.nom,
      e.salle_id,
      s.code AS salle_code
    FROM Equipement e
    LEFT JOIN Salle s ON e.salle_id = s.id
    WHERE e.id = ?
    `,
    [id]
  );

  if (!row) {
    throw new ApiError(404, "Équipement introuvable");
  }

  res.json(row);
};

exports.create = async (req, res) => {
  const { nom, salle_id } = req.body;

  if (!nom || !salle_id) {
    throw new ApiError(400, "Nom et salle_id sont requis");
  }

  const salle = await dbGet(
    `
    SELECT id
    FROM Salle
    WHERE id = ?
    `,
    [Number(salle_id)]
  );

  if (!salle) {
    throw new ApiError(404, "Salle introuvable");
  }

  const result = await dbRun(
    `
    INSERT INTO Equipement (nom, salle_id)
    VALUES (?, ?)
    `,
    [String(nom).trim(), Number(salle_id)]
  );

  const created = await dbGet(
    `
    SELECT
      e.id,
      e.nom,
      e.salle_id,
      s.code AS salle_code
    FROM Equipement e
    LEFT JOIN Salle s ON e.salle_id = s.id
    WHERE e.id = ?
    `,
    [result.lastID]
  );

  res.status(201).json({
    message: "Équipement créé avec succès",
    equipement: created,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id équipement invalide");
  }

  const existing = await dbGet(
    `
    SELECT *
    FROM Equipement
    WHERE id = ?
    `,
    [id]
  );

  if (!existing) {
    throw new ApiError(404, "Équipement introuvable");
  }

  const finalNom = req.body.nom ?? existing.nom;
  const finalSalleId = req.body.salle_id ?? existing.salle_id;

  const salle = await dbGet(
    `
    SELECT id
    FROM Salle
    WHERE id = ?
    `,
    [Number(finalSalleId)]
  );

  if (!salle) {
    throw new ApiError(404, "Salle introuvable");
  }

  await dbRun(
    `
    UPDATE Equipement
    SET
      nom = ?,
      salle_id = ?
    WHERE id = ?
    `,
    [String(finalNom).trim(), Number(finalSalleId), id]
  );

  const updated = await dbGet(
    `
    SELECT
      e.id,
      e.nom,
      e.salle_id,
      s.code AS salle_code
    FROM Equipement e
    LEFT JOIN Salle s ON e.salle_id = s.id
    WHERE e.id = ?
    `,
    [id]
  );

  res.json({
    message: "Équipement mis à jour",
    equipement: updated,
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id équipement invalide");
  }

  const existing = await dbGet(
    `
    SELECT id
    FROM Equipement
    WHERE id = ?
    `,
    [id]
  );

  if (!existing) {
    throw new ApiError(404, "Équipement introuvable");
  }

  await dbRun(
    `
    DELETE FROM Equipement
    WHERE id = ?
    `,
    [id]
  );

  res.json({
    message: "Équipement supprimé",
    id,
  });
};