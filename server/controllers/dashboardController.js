const { dbAll, dbGet } = require("../db/dbAsync");

exports.getStats = async (req, res) => {
  const [
    nbSalles,
    nbCohortes,
    nbSeances,
    nbReservations,
    nbConflitsOuverts,
  ] = await Promise.all([
    dbGet(`SELECT COUNT(*) AS total FROM Salle WHERE isActive = 1`),
    dbGet(`SELECT COUNT(*) AS total FROM Cohorte`),
    dbGet(`SELECT COUNT(*) AS total FROM Seance`),
    dbGet(`SELECT COUNT(*) AS total FROM Reservation`),
    dbGet(`SELECT COUNT(*) AS total FROM Conflit WHERE resolu = 0`),
  ]);

  res.json({
    sallesActives: nbSalles.total,
    cohortes: nbCohortes.total,
    seances: nbSeances.total,
    reservations: nbReservations.total,
    conflitsOuverts: nbConflitsOuverts.total,
  });
};

exports.getOccupationSalles = async (req, res) => {
  const rows = await dbAll(`
    SELECT
      s.id,
      s.code,
      COUNT(r.id) AS nb_reservations
    FROM Salle s
    LEFT JOIN Reservation r
      ON r.salle_id = s.id
      AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
    WHERE s.isActive = 1
    GROUP BY s.id, s.code
    ORDER BY nb_reservations DESC, s.code ASC
  `);

  res.json(rows);
};

exports.getTopCohortes = async (req, res) => {
  const rows = await dbAll(`
    SELECT
      c.id,
      c.nom,
      COUNT(se.id) AS nb_seances
    FROM Cohorte c
    LEFT JOIN Seance se ON se.cohorte_id = c.id
    GROUP BY c.id, c.nom
    ORDER BY nb_seances DESC, c.nom ASC
  `);

  res.json(rows);
};