const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT
      e.id,
      e.nom,
      e.salle_id,
      s.code AS salle_code
    FROM Equipement e
    LEFT JOIN Salle s ON e.salle_id = s.id
    ORDER BY e.nom ASC
  `);

exports.findById = (id) =>
  dbGet(
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

exports.findBySalleId = (salleId) =>
  dbAll(
    `
    SELECT
      e.id,
      e.nom,
      e.salle_id,
      s.code AS salle_code
    FROM Equipement e
    LEFT JOIN Salle s ON e.salle_id = s.id
    WHERE e.salle_id = ?
    ORDER BY e.nom ASC
    `,
    [salleId]
  );

exports.create = ({ nom, salle_id }) =>
  dbRun(
    `
    INSERT INTO Equipement (nom, salle_id)
    VALUES (?, ?)
    `,
    [nom, salle_id]
  );

exports.update = (id, { nom, salle_id }) =>
  dbRun(
    `
    UPDATE Equipement
    SET
      nom = ?,
      salle_id = ?
    WHERE id = ?
    `,
    [nom, salle_id, id]
  );

exports.remove = (id) =>
  dbRun(
    `
    DELETE FROM Equipement
    WHERE id = ?
    `,
    [id]
  );