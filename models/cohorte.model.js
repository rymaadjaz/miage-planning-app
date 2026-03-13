const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`SELECT * FROM cohortes WHERE isActive=1 ORDER BY annee ASC, nom ASC`);

exports.findById = (id) =>
  dbGet(`SELECT * FROM cohortes WHERE id=? AND isActive=1`, [id]);

exports.create = ({ nom, annee, filiere = null, specialite = null, effectif, parent_id = null }) =>
  dbRun(
    `INSERT INTO cohortes (nom, annee, filiere, specialite, effectif, parent_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nom, annee, filiere, specialite, effectif, parent_id]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE cohortes
     SET nom=?, annee=?, filiere=?, specialite=?, effectif=?, parent_id=?
     WHERE id=?`,
    [data.nom, data.annee, data.filiere, data.specialite, data.effectif, data.parent_id, id]
  );

exports.softDelete = (id) =>
  dbRun(`UPDATE cohortes SET isActive=0 WHERE id=?`, [id]);