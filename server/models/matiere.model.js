const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`SELECT * FROM Matiere ORDER BY nom ASC`);

exports.findById = (id) =>
  dbGet(`SELECT * FROM Matiere WHERE id = ?`, [id]);

exports.create = ({ nom, volumeHoraireTotal = 0 }) =>
  dbRun(
    `INSERT INTO Matiere (nom, volumeHoraireTotal)
     VALUES (?, ?)`,
    [nom, volumeHoraireTotal]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE Matiere
     SET nom = ?, volumeHoraireTotal = ?
     WHERE id = ?`,
    [data.nom, data.volumeHoraireTotal, id]
  );

exports.remove = (id) =>
  dbRun(`DELETE FROM Matiere WHERE id = ?`, [id]);