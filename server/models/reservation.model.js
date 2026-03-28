const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT *
    FROM Reservation
    ORDER BY created_at DESC
  `);

exports.findById = (id) =>
  dbGet(
    `
    SELECT *
    FROM Reservation
    WHERE id = ?
    `,
    [id]
  );

exports.findFrontDemandes = () =>
  dbAll(`
    SELECT
      r.id,
      r.type_demande,
      r.statut,
      r.motif,
      r.created_at,
      r.date_souhaitee,
      r.heure_debut_souhaitee,
      r.duree_souhaitee,
      r.type_seance_souhaitee,
      r.seance_id,
      r.salle_id,
      r.cohorte_id,
      r.enseignant_id,

      s.code AS salle_code,
      c.nom AS cohorte_nom,
      u.nom AS enseignant_nom,
      u.prenom AS enseignant_prenom,

      se.dateSeance,
      se.heureDebut,
      se.duree,
      se.typeSeance,
      se.description AS seance_description

    FROM Reservation r
    LEFT JOIN Salle s ON r.salle_id = s.id
    LEFT JOIN Cohorte c ON r.cohorte_id = c.id
    LEFT JOIN Utilisateur u ON r.enseignant_id = u.id
    LEFT JOIN Seance se ON r.seance_id = se.id
    ORDER BY r.created_at DESC
  `);

exports.create = ({
  type_demande = "MODIFICATION",
  seance_id = null,
  salle_id = null,
  demandeur_id = null,
  date_souhaitee = null,
  heure_debut_souhaitee = null,
  duree_souhaitee = null,
  type_seance_souhaitee = null,
  cohorte_id = null,
  enseignant_id = null,
  statut = "EN_ATTENTE",
  priorite = 2,
  motif = null,
}) =>
  dbRun(
    `
    INSERT INTO Reservation (
      type_demande,
      seance_id,
      salle_id,
      demandeur_id,
      date_souhaitee,
      heure_debut_souhaitee,
      duree_souhaitee,
      type_seance_souhaitee,
      cohorte_id,
      enseignant_id,
      statut,
      priorite,
      motif
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      type_demande,
      seance_id,
      salle_id,
      demandeur_id,
      date_souhaitee,
      heure_debut_souhaitee,
      duree_souhaitee,
      type_seance_souhaitee,
      cohorte_id,
      enseignant_id,
      statut,
      priorite,
      motif,
    ]
  );

exports.update = (id, data) =>
  dbRun(
    `
    UPDATE Reservation
    SET
      type_demande = ?,
      seance_id = ?,
      salle_id = ?,
      date_souhaitee = ?,
      heure_debut_souhaitee = ?,
      duree_souhaitee = ?,
      type_seance_souhaitee = ?,
      cohorte_id = ?,
      enseignant_id = ?,
      priorite = ?,
      motif = ?
    WHERE id = ?
    `,
    [
      data.type_demande,
      data.seance_id,
      data.salle_id,
      data.date_souhaitee,
      data.heure_debut_souhaitee,
      data.duree_souhaitee,
      data.type_seance_souhaitee,
      data.cohorte_id,
      data.enseignant_id,
      data.priorite,
      data.motif,
      id,
    ]
  );

exports.updateStatus = (id, statut) =>
  dbRun(
    `
    UPDATE Reservation
    SET statut = ?
    WHERE id = ?
    `,
    [statut, id]
  );

exports.findActiveBySeance = (seanceId, excludeReservationId = null) => {
  const sql = `
    SELECT *
    FROM Reservation
    WHERE seance_id = ?
      AND type_demande = 'MODIFICATION'
      AND statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
      ${excludeReservationId ? "AND id != ?" : ""}
    LIMIT 1
  `;

  const params = excludeReservationId ? [seanceId, excludeReservationId] : [seanceId];
  return dbGet(sql, params);
};

exports.findSalleConflicts = (salleId, startSql, endSql, excludeReservationId = null) => {
  const sql = `
    SELECT r.id
    FROM Reservation r
    JOIN Seance se ON r.seance_id = se.id
    WHERE r.salle_id = ?
      AND r.type_demande = 'MODIFICATION'
      AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
      ${excludeReservationId ? "AND r.id != ?" : ""}
      AND datetime(se.dateSeance || ' ' || se.heureDebut) < datetime(?)
      AND datetime(se.dateSeance || ' ' || se.heureDebut, '+' || se.duree || ' minutes') > datetime(?)
  `;

  const params = excludeReservationId
    ? [salleId, excludeReservationId, endSql, startSql]
    : [salleId, endSql, startSql];

  return dbAll(sql, params);
};

exports.findCohorteConflicts = (cohorteId, startSql, endSql, excludeReservationId = null) => {
  const sql = `
    SELECT r.id
    FROM Reservation r
    JOIN Seance se ON r.seance_id = se.id
    WHERE se.cohorte_id = ?
      AND r.type_demande = 'MODIFICATION'
      AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
      ${excludeReservationId ? "AND r.id != ?" : ""}
      AND datetime(se.dateSeance || ' ' || se.heureDebut) < datetime(?)
      AND datetime(se.dateSeance || ' ' || se.heureDebut, '+' || se.duree || ' minutes') > datetime(?)
  `;

  const params = excludeReservationId
    ? [cohorteId, excludeReservationId, endSql, startSql]
    : [cohorteId, endSql, startSql];

  return dbAll(sql, params);
};

exports.findEnseignantConflicts = (enseignantId, startSql, endSql, excludeReservationId = null) => {
  const sql = `
    SELECT r.id
    FROM Reservation r
    JOIN Seance se ON r.seance_id = se.id
    WHERE se.enseignant_id = ?
      AND r.type_demande = 'MODIFICATION'
      AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
      ${excludeReservationId ? "AND r.id != ?" : ""}
      AND datetime(se.dateSeance || ' ' || se.heureDebut) < datetime(?)
      AND datetime(se.dateSeance || ' ' || se.heureDebut, '+' || se.duree || ' minutes') > datetime(?)
  `;

  const params = excludeReservationId
    ? [enseignantId, excludeReservationId, endSql, startSql]
    : [enseignantId, endSql, startSql];

  return dbAll(sql, params);
};

exports.findAlternativeSalles = ({ excludeSalleId, type, effectif, pmr, limit = 5 }) =>
  dbAll(
    `
    SELECT *
    FROM Salle
    WHERE id != ?
      AND isActive = 1
      AND type = ?
      AND capacite >= ?
      AND accessibilitePMR >= ?
    ORDER BY capacite ASC
    LIMIT ?
    `,
    [excludeSalleId, type, effectif, pmr ? 1 : 0, limit]
  );