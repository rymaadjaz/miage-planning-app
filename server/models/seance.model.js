const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT *
    FROM Seance
    ORDER BY dateSeance ASC, heureDebut ASC
  `);

exports.findById = (id) =>
  dbGet(
    `
    SELECT *
    FROM Seance
    WHERE id = ?
    `,
    [id]
  );

exports.findByCohorteId = (cohorteId) =>
  dbAll(
    `
    SELECT *
    FROM Seance
    WHERE cohorte_id = ?
    ORDER BY dateSeance ASC, heureDebut ASC
    `,
    [cohorteId]
  );

exports.findByEnseignantId = (enseignantId) =>
  dbAll(
    `
    SELECT *
    FROM Seance
    WHERE enseignant_id = ?
    ORDER BY dateSeance ASC, heureDebut ASC
    `,
    [enseignantId]
  );

exports.create = ({
  dateSeance,
  heureDebut,
  duree,
  typeSeance,
  statut = "PLANIFIE",
  description = null,
  matiere_id = null,
  cohorte_id = null,
  enseignant_id = null,
}) =>
  dbRun(
    `
    INSERT INTO Seance (
      dateSeance,
      heureDebut,
      duree,
      typeSeance,
      statut,
      description,
      matiere_id,
      cohorte_id,
      enseignant_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dateSeance,
      heureDebut,
      duree,
      typeSeance,
      statut,
      description,
      matiere_id,
      cohorte_id,
      enseignant_id,
    ]
  );

exports.update = (
  id,
  {
    dateSeance,
    heureDebut,
    duree,
    typeSeance,
    statut,
    description,
    matiere_id,
    cohorte_id,
    enseignant_id,
  }
) =>
  dbRun(
    `
    UPDATE Seance
    SET
      dateSeance = ?,
      heureDebut = ?,
      duree = ?,
      typeSeance = ?,
      statut = ?,
      description = ?,
      matiere_id = ?,
      cohorte_id = ?,
      enseignant_id = ?
    WHERE id = ?
    `,
    [
      dateSeance,
      heureDebut,
      duree,
      typeSeance,
      statut,
      description,
      matiere_id,
      cohorte_id,
      enseignant_id,
      id,
    ]
  );

exports.remove = (id) =>
  dbRun(
    `
    DELETE FROM Seance
    WHERE id = ?
    `,
    [id]
  );