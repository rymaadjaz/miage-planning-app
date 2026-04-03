const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT *
    FROM Disponibilite
    ORDER BY enseignant_id ASC, jour ASC, heureDebut ASC
  `);

exports.findById = (id) =>
  dbGet(
    `
    SELECT *
    FROM Disponibilite
    WHERE id = ?
    `,
    [id]
  );

exports.findByEnseignantId = (enseignantId) =>
  dbAll(
    `
    SELECT *
    FROM Disponibilite
    WHERE enseignant_id = ?
    ORDER BY
      CASE jour
        WHEN 'Lundi' THEN 1
        WHEN 'Mardi' THEN 2
        WHEN 'Mercredi' THEN 3
        WHEN 'Jeudi' THEN 4
        WHEN 'Vendredi' THEN 5
        ELSE 6
      END,
      heureDebut ASC
    `,
    [enseignantId]
  );

exports.create = ({
  enseignant_id,
  jour,
  heureDebut,
  heureFin,
  disponible = 1,
}) =>
  dbRun(
    `
    INSERT INTO Disponibilite (enseignant_id, jour, heureDebut, heureFin, disponible)
    VALUES (?, ?, ?, ?, ?)
    `,
    [enseignant_id, jour, heureDebut, heureFin, disponible]
  );

exports.update = (
  id,
  {
    enseignant_id,
    jour,
    heureDebut,
    heureFin,
    disponible,
  }
) =>
  dbRun(
    `
    UPDATE Disponibilite
    SET
      enseignant_id = ?,
      jour = ?,
      heureDebut = ?,
      heureFin = ?,
      disponible = ?
    WHERE id = ?
    `,
    [enseignant_id, jour, heureDebut, heureFin, disponible, id]
  );

exports.remove = (id) =>
  dbRun(
    `
    DELETE FROM Disponibilite
    WHERE id = ?
    `,
    [id]
  );