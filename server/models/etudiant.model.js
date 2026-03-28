const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT
      e.id,
      e.numeroEtudiant,
      e.annee,
      e.filiere,
      e.cohorte_id,
      c.nom AS cohorte_nom,
      u.nom,
      u.prenom,
      u.email,
      u.role,
      u.created_at
    FROM Etudiant e
    JOIN Utilisateur u ON e.id = u.id
    LEFT JOIN Cohorte c ON e.cohorte_id = c.id
    ORDER BY u.nom ASC, u.prenom ASC
  `);

exports.findById = (id) =>
  dbGet(
    `
    SELECT
      e.id,
      e.numeroEtudiant,
      e.annee,
      e.filiere,
      e.cohorte_id,
      c.nom AS cohorte_nom,
      u.nom,
      u.prenom,
      u.email,
      u.role,
      u.created_at
    FROM Etudiant e
    JOIN Utilisateur u ON e.id = u.id
    LEFT JOIN Cohorte c ON e.cohorte_id = c.id
    WHERE e.id = ?
    `,
    [id]
  );

exports.create = ({
  id,
  numeroEtudiant,
  annee = null,
  filiere = null,
  cohorte_id = null,
}) =>
  dbRun(
    `
    INSERT INTO Etudiant (id, numeroEtudiant, annee, filiere, cohorte_id)
    VALUES (?, ?, ?, ?, ?)
    `,
    [id, numeroEtudiant, annee, filiere, cohorte_id]
  );

exports.update = (id, { numeroEtudiant, annee, filiere, cohorte_id }) =>
  dbRun(
    `
    UPDATE Etudiant
    SET
      numeroEtudiant = ?,
      annee = ?,
      filiere = ?,
      cohorte_id = ?
    WHERE id = ?
    `,
    [numeroEtudiant, annee, filiere, cohorte_id, id]
  );

exports.remove = (id) =>
  dbRun(
    `
    DELETE FROM Etudiant
    WHERE id = ?
    `,
    [id]
  );