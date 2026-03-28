const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT *
    FROM MaintenanceSalle
    ORDER BY dateDebut ASC
  `);

exports.findById = (id) =>
  dbGet(
    `
    SELECT *
    FROM MaintenanceSalle
    WHERE id = ?
    `,
    [id]
  );

exports.findBySalleId = (salleId) =>
  dbAll(
    `
    SELECT *
    FROM MaintenanceSalle
    WHERE salle_id = ?
    ORDER BY dateDebut ASC
    `,
    [salleId]
  );

exports.findOverlap = (salleId, startSql, endSql) =>
  dbGet(
    `
    SELECT *
    FROM MaintenanceSalle
    WHERE salle_id = ?
      AND statut = 'PLANIFIEE'
      AND datetime(dateDebut) < datetime(?)
      AND datetime(dateFin) > datetime(?)
    LIMIT 1
    `,
    [salleId, endSql, startSql]
  );

exports.create = ({
  salle_id,
  dateDebut,
  dateFin,
  description = null,
  statut = "PLANIFIEE",
}) =>
  dbRun(
    `
    INSERT INTO MaintenanceSalle (salle_id, dateDebut, dateFin, description, statut)
    VALUES (?, ?, ?, ?, ?)
    `,
    [salle_id, dateDebut, dateFin, description, statut]
  );

exports.update = (
  id,
  { salle_id, dateDebut, dateFin, description, statut }
) =>
  dbRun(
    `
    UPDATE MaintenanceSalle
    SET
      salle_id = ?,
      dateDebut = ?,
      dateFin = ?,
      description = ?,
      statut = ?
    WHERE id = ?
    `,
    [salle_id, dateDebut, dateFin, description, statut, id]
  );

exports.remove = (id) =>
  dbRun(
    `
    DELETE FROM MaintenanceSalle
    WHERE id = ?
    `,
    [id]
  );