const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT *
    FROM Cohorte
    ORDER BY nom ASC
  `);

exports.findById = (id) =>
  dbGet(
    `
    SELECT *
    FROM Cohorte
    WHERE id = ?
    `,
    [id]
  );

exports.findByNom = (nom) =>
  dbGet(
    `
    SELECT *
    FROM Cohorte
    WHERE nom = ?
    `,
    [nom]
  );

exports.create = ({ nom, effectif = 0, niveau = null }) =>
  dbRun(
    `
    INSERT INTO Cohorte (nom, effectif, niveau)
    VALUES (?, ?, ?)
    `,
    [nom, effectif, niveau]
  );

exports.update = (id, { nom, effectif, niveau }) =>
  dbRun(
    `
    UPDATE Cohorte
    SET
      nom = ?,
      effectif = ?,
      niveau = ?
    WHERE id = ?
    `,
    [nom, effectif, niveau, id]
  );

exports.remove = (id) =>
  dbRun(
    `
    DELETE FROM Cohorte
    WHERE id = ?
    `,
    [id]
  );