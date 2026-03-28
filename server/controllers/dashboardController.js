const { dbGet } = require("../db/dbAsync");

exports.getStats = async (_req, res) => {
  const [
    salles,
    utilisateurs,
    reservations,
    reservationsEnAttente,
    conflitsNonResolus,
    seances,
    cohortes,
    notificationsImportantes,
  ] = await Promise.all([
    dbGet(`SELECT COUNT(*) AS total FROM Salle`),
    dbGet(`SELECT COUNT(*) AS total FROM Utilisateur`),
    dbGet(`SELECT COUNT(*) AS total FROM Reservation`),
    dbGet(`SELECT COUNT(*) AS total FROM Reservation WHERE statut = 'EN_ATTENTE'`),
    dbGet(`SELECT COUNT(*) AS total FROM Conflit WHERE resolu = 0`),
    dbGet(`SELECT COUNT(*) AS total FROM Seance`),
    dbGet(`SELECT COUNT(*) AS total FROM Cohorte`),
    dbGet(`SELECT COUNT(*) AS total FROM Notification WHERE status = 'important'`),
  ]);

  res.json({
    salles: salles.total,
    utilisateurs: utilisateurs.total,
    reservations: reservations.total,
    reservationsEnAttente: reservationsEnAttente.total,
    conflitsNonResolus: conflitsNonResolus.total,
    seances: seances.total,
    cohortes: cohortes.total,
    notificationsImportantes: notificationsImportantes.total,
  });
};