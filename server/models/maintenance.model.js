const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.create = ({ salle_id, dateDebut, dateFin, description = "", statut = "PLANIFIEE" }) =>
  dbRun(
    `INSERT INTO MaintenanceSalle (salle_id, dateDebut, dateFin, description, statut)
     VALUES (?, ?, ?, ?, ?)`,
    [salle_id, dateDebut, dateFin, description, statut]
  );

exports.findBySalle = (salleId) =>
  dbAll(
    `SELECT * 
     FROM MaintenanceSalle
     WHERE salle_id = ?
     ORDER BY dateDebut DESC`,
    [salleId]
  );

exports.findOverlap = (salleId, startIso, endIso) =>
  dbGet(
    `SELECT *
     FROM MaintenanceSalle
     WHERE salle_id = ?
       AND statut = 'PLANIFIEE'
       AND dateDebut < ?
       AND dateFin > ?
     LIMIT 1`,
    [salleId, endIso, startIso]
  );