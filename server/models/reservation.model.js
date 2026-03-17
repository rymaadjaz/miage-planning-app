const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findById = (id) =>
  dbGet(`SELECT * FROM Reservation WHERE id = ?`, [id]);

exports.getAllDetailed = () =>
  dbAll(`
    SELECT
      r.*,
      sa.code AS salle_code,
      sa.capacite AS salle_capacite,
      sa.type AS salle_type,
      se.dateSeance,
      se.heureDebut,
      se.duree,
      se.typeSeance,
      se.statut AS seance_statut,
      se.enseignant_id,
      co.nom AS cohorte_nom,
      co.effectif AS cohorte_effectif
    FROM Reservation r
    JOIN Salle sa ON r.salle_id = sa.id
    JOIN Seance se ON r.seance_id = se.id
    LEFT JOIN Cohorte co ON se.cohorte_id = co.id
    ORDER BY se.dateSeance ASC, se.heureDebut ASC
  `);

exports.findActiveReservationsBySalle = (salleId) =>
  dbAll(
    `SELECT *
     FROM Reservation
     WHERE salle_id = ?
       AND statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')`,
    [salleId]
  );

exports.findSalleConflicts = (salleId, startIso, endIso, excludeId = null) => {
  const params = [salleId, endIso, startIso];
  let sql = `
    SELECT r.*
    FROM Reservation r
    JOIN Seance se ON r.seance_id = se.id
    WHERE r.salle_id = ?
      AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
      AND datetime(se.dateSeance || ' ' || se.heureDebut) < datetime(?)
      AND datetime(se.dateSeance || ' ' || se.heureDebut, '+' || se.duree || ' minutes') > datetime(?)
  `;

  if (excludeId) {
    sql += ` AND r.id <> ?`;
    params.push(excludeId);
  }

  return dbAll(sql, params);
};

exports.findCohorteConflicts = (cohorteId, startIso, endIso, excludeId = null) => {
  const params = [cohorteId, endIso, startIso];
  let sql = `
    SELECT r.*
    FROM Reservation r
    JOIN Seance se ON r.seance_id = se.id
    WHERE se.cohorte_id = ?
      AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
      AND datetime(se.dateSeance || ' ' || se.heureDebut) < datetime(?)
      AND datetime(se.dateSeance || ' ' || se.heureDebut, '+' || se.duree || ' minutes') > datetime(?)
  `;

  if (excludeId) {
    sql += ` AND r.id <> ?`;
    params.push(excludeId);
  }

  return dbAll(sql, params);
};

exports.findEnseignantConflicts = (enseignantId, startIso, endIso, excludeId = null) => {
  const params = [enseignantId, endIso, startIso];
  let sql = `
    SELECT r.*
    FROM Reservation r
    JOIN Seance se ON r.seance_id = se.id
    WHERE se.enseignant_id = ?
      AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
      AND datetime(se.dateSeance || ' ' || se.heureDebut) < datetime(?)
      AND datetime(se.dateSeance || ' ' || se.heureDebut, '+' || se.duree || ' minutes') > datetime(?)
  `;

  if (excludeId) {
    sql += ` AND r.id <> ?`;
    params.push(excludeId);
  }

  return dbAll(sql, params);
};

exports.create = ({ salle_id, seance_id, statut, priorite, demandeur_id = null, motif = null }) =>
  dbRun(
    `INSERT INTO Reservation (salle_id, seance_id, statut, priorite, demandeur_id, motif)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [salle_id, seance_id, statut, priorite, demandeur_id, motif]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE Reservation
     SET salle_id = ?, seance_id = ?, statut = ?, motif = ?
     WHERE id = ?`,
    [data.salle_id, data.seance_id, data.statut, data.motif, id]
  );

exports.updateStatus = (id, statut) =>
  dbRun(
    `UPDATE Reservation
     SET statut = ?
     WHERE id = ?`,
    [statut, id]
  );

exports.findAlternativeSalles = ({
  excludeSalleId,
  type,
  effectif,
  pmr,
  startIso,
  endIso,
  limit = 5,
}) =>
  dbAll(
    `
    SELECT sa.*
    FROM Salle sa
    WHERE sa.isActive = 1
      AND sa.id <> ?
      AND sa.type = ?
      AND sa.capacite >= ?
      AND (? = 0 OR sa.accessibilitePMR = 1)
      AND NOT EXISTS (
        SELECT 1
        FROM MaintenanceSalle m
        WHERE m.salle_id = sa.id
          AND m.statut = 'PLANIFIEE'
          AND m.dateDebut < ?
          AND m.dateFin > ?
      )
      AND NOT EXISTS (
        SELECT 1
        FROM Reservation r
        JOIN Seance se ON r.seance_id = se.id
        WHERE r.salle_id = sa.id
          AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
          AND datetime(se.dateSeance || ' ' || se.heureDebut) < datetime(?)
          AND datetime(se.dateSeance || ' ' || se.heureDebut, '+' || se.duree || ' minutes') > datetime(?)
      )
    ORDER BY sa.capacite ASC
    LIMIT ?
    `,
    [excludeSalleId, type, effectif, pmr ? 1 : 0, endIso, startIso, endIso, startIso, limit]
  );