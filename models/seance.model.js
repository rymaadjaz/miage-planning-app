const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT se.*, co.nom AS cohorte_nom
    FROM seances se
    JOIN cohortes co ON se.cohorte_id = co.id
    WHERE se.isActive=1
    ORDER BY se.id DESC
  `);

exports.findById = (id) =>
  dbGet(`SELECT * FROM seances WHERE id=? AND isActive=1`, [id]);

exports.create = ({ nom, type, duree_minutes = 90, enseignant_id, cohorte_id }) =>
  dbRun(
    `INSERT INTO seances (nom, type, duree_minutes, enseignant_id, cohorte_id)
     VALUES (?, ?, ?, ?, ?)`,
    [nom, type, duree_minutes, enseignant_id, cohorte_id]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE seances
     SET nom=?, type=?, duree_minutes=?, enseignant_id=?, cohorte_id=?
     WHERE id=?`,
    [data.nom, data.type, data.duree_minutes, data.enseignant_id, data.cohorte_id, id]
  );

exports.softDelete = (id) =>
  dbRun(`UPDATE seances SET isActive=0 WHERE id=?`, [id]);