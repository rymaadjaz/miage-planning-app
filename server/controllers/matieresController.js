const ApiError = require("../utils/ApiError");
const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.getAll = async (_req, res) => {
  const rows = await dbAll(`
    SELECT *
    FROM Matiere
    ORDER BY nom ASC
  `);

  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id matière invalide");
  }

  const row = await dbGet(
    `
    SELECT *
    FROM Matiere
    WHERE id = ?
    `,
    [id]
  );

  if (!row) {
    throw new ApiError(404, "Matière introuvable");
  }

  res.json(row);
};

exports.create = async (req, res) => {
  const { nom, volumeHoraireTotal = 0 } = req.body;

  if (!nom || String(nom).trim() === "") {
    throw new ApiError(400, "Nom de matière requis");
  }

  const existing = await dbGet(
    `
    SELECT id
    FROM Matiere
    WHERE nom = ?
    `,
    [String(nom).trim()]
  );

  if (existing) {
    throw new ApiError(409, "Cette matière existe déjà");
  }

  const result = await dbRun(
    `
    INSERT INTO Matiere (nom, volumeHoraireTotal)
    VALUES (?, ?)
    `,
    [String(nom).trim(), Number(volumeHoraireTotal) || 0]
  );

  const created = await dbGet(
    `
    SELECT *
    FROM Matiere
    WHERE id = ?
    `,
    [result.lastID]
  );

  res.status(201).json({
    message: "Matière créée avec succès",
    matiere: created,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id matière invalide");
  }

  const existing = await dbGet(
    `
    SELECT *
    FROM Matiere
    WHERE id = ?
    `,
    [id]
  );

  if (!existing) {
    throw new ApiError(404, "Matière introuvable");
  }

  const finalNom = req.body.nom ?? existing.nom;
  const finalVolume = req.body.volumeHoraireTotal ?? existing.volumeHoraireTotal;

  const duplicate = await dbGet(
    `
    SELECT id
    FROM Matiere
    WHERE nom = ? AND id != ?
    `,
    [String(finalNom).trim(), id]
  );

  if (duplicate) {
    throw new ApiError(409, "Une autre matière porte déjà ce nom");
  }

  await dbRun(
    `
    UPDATE Matiere
    SET
      nom = ?,
      volumeHoraireTotal = ?
    WHERE id = ?
    `,
    [String(finalNom).trim(), Number(finalVolume) || 0, id]
  );

  const updated = await dbGet(
    `
    SELECT *
    FROM Matiere
    WHERE id = ?
    `,
    [id]
  );

  res.json({
    message: "Matière mise à jour",
    matiere: updated,
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id matière invalide");
  }

  const existing = await dbGet(
    `
    SELECT id
    FROM Matiere
    WHERE id = ?
    `,
    [id]
  );

  if (!existing) {
    throw new ApiError(404, "Matière introuvable");
  }

  await dbRun(
    `
    DELETE FROM Matiere
    WHERE id = ?
    `,
    [id]
  );

  res.json({
    message: "Matière supprimée",
    id,
  });
};