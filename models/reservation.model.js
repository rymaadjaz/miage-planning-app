const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findById = (id) => dbGet(`SELECT * FROM reservations WHERE id=?`, [id]);

exports.getAllDetailed = () =>
  dbAll(`
    SELECT r.*,
           s.nom AS salle_nom,
           se.nom AS seance_nom,
           se.type AS seance_type,
           se.enseignant_id,
           co.nom AS cohorte_nom,
           co.effectif AS cohorte_effectif
    FROM reservations r
    JOIN salles s ON r.salle_id = s.id
    JOIN seances se ON r.seance_id = se.id
    JOIN cohortes co ON se.cohorte_id = co.id
    ORDER BY r.heure_debut ASC
  `);


exports.findActiveReservationsBySalle = (salleId) =>
  dbAll(
    `SELECT * FROM reservations
     WHERE salle_id = ?
       AND statut IN ('PLANIFIEE', 'VALIDEE')`,
    [salleId]
  );

exports.findSalleConflicts = (salleId, startIso, endIso, excludeId = null) => {
  const params = [salleId, endIso, startIso];
  let sql = `
    SELECT * FROM reservations
    WHERE salle_id=?
      AND statut IN ('PLANIFIEE','VALIDEE')
      AND heure_debut < ?
      AND heure_fin > ?
  `;
  if (excludeId) {
    sql += " AND id <> ?";
    params.push(excludeId);
  }
  return dbAll(sql, params);
};

// Conflit cohorte
exports.findCohorteConflicts = (cohorteId, startIso, endIso, excludeId = null) => {
  const params = [cohorteId, endIso, startIso];
  let sql = `
    SELECT r.*
    FROM reservations r
    JOIN seances se ON r.seance_id = se.id
    WHERE se.cohorte_id=?
      AND r.statut IN ('PLANIFIEE','VALIDEE')
      AND r.heure_debut < ?
      AND r.heure_fin > ?
  `;
  if (excludeId) {
    sql += " AND r.id <> ?";
    params.push(excludeId);
  }
  return dbAll(sql, params);
};

// Conflit enseignant
exports.findEnseignantConflicts = (enseignantId, startIso, endIso, excludeId = null) => {
  const params = [enseignantId, endIso, startIso];
  let sql = `
    SELECT r.*
    FROM reservations r
    JOIN seances se ON r.seance_id = se.id
    WHERE se.enseignant_id=?
      AND r.statut IN ('PLANIFIEE','VALIDEE')
      AND r.heure_debut < ?
      AND r.heure_fin > ?
  `;
  if (excludeId) {
    sql += " AND r.id <> ?";
    params.push(excludeId);
  }
  return dbAll(sql, params);
};

exports.create = (data) =>
  dbRun(
    `INSERT INTO reservations (salle_id, seance_id, heure_debut, heure_fin, statut, priorite, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.salle_id, data.seance_id, data.heure_debut, data.heure_fin, data.statut, data.priorite, data.created_by]
  );

exports.updateTimes = (id, data) =>
  dbRun(
    `UPDATE reservations
     SET salle_id=?, heure_debut=?, heure_fin=?, version=version+1
     WHERE id=?`,
    [data.salle_id, data.heure_debut, data.heure_fin, id]
  );

exports.updateStatus = (id, statut) =>
  dbRun(
    `UPDATE reservations
     SET statut=?, version=version+1
     WHERE id=?`,
    [statut, id]
  );

// Alternatives
exports.findAlternativeSalles = ({ excludeSalleId, type, effectif, pmr, startIso, endIso, limit = 5 }) =>
  dbAll(
    `
    SELECT sa.*
    FROM salles sa
    WHERE sa.isActive=1
      AND sa.id <> ?
      AND sa.type = ?
      AND sa.capacite >= ?
      AND (? = 0 OR sa.accessiblePMR = 1)
      AND NOT EXISTS (
        SELECT 1 FROM maintenance_salles m
        WHERE m.salle_id = sa.id
          AND m.statut='PLANNED'
          AND m.date_debut < ?
          AND m.date_fin > ?
      )
      AND NOT EXISTS (
        SELECT 1 FROM reservations r
        WHERE r.salle_id = sa.id
          AND r.statut IN ('PLANIFIEE','VALIDEE')
          AND r.heure_debut < ?
          AND r.heure_fin > ?
      )
    ORDER BY sa.capacite ASC
    LIMIT ?
    `,
    [excludeSalleId, type, effectif, pmr ? 1 : 0, endIso, startIso, endIso, startIso, limit]
  );