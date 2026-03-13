const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.create = ({ salle_id, date_debut, date_fin, description = "", statut = "PLANNED" }) =>
  dbRun(
    `INSERT INTO maintenance_salles (salle_id, date_debut, date_fin, description, statut)
     VALUES (?, ?, ?, ?, ?)`,
    [salle_id, date_debut, date_fin, description, statut]
  );

exports.findBySalle = (salleId) =>
  dbAll(
    `SELECT * FROM maintenance_salles WHERE salle_id=? ORDER BY date_debut DESC`,
    [salleId]
  );

exports.findOverlap = (salleId, startIso, endIso) =>
  dbGet(
    `SELECT * FROM maintenance_salles
     WHERE salle_id=?
       AND statut='PLANNED'
       AND date_debut < ?
       AND date_fin > ?
     LIMIT 1`,
    [salleId, endIso, startIso]
  );