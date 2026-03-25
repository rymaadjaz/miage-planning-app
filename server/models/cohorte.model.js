const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`SELECT * FROM Cohorte ORDER BY nom ASC`);

exports.findById = (id) =>
  dbGet(`SELECT * FROM Cohorte WHERE id = ?`, [id]);

exports.create = ({ nom, effectif, niveau = null }) =>
  dbRun(
    `INSERT INTO Cohorte (nom, effectif, niveau)
     VALUES (?, ?, ?)`,
    [nom, effectif, niveau]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE Cohorte
     SET nom = ?, effectif = ?, niveau = ?
     WHERE id = ?`,
    [data.nom, data.effectif, data.niveau, id]
  );

exports.remove = (id) =>
  dbRun(`DELETE FROM Cohorte WHERE id = ?`, [id]);