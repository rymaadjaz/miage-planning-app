const ApiError = require("../utils/ApiError");


const salleModel = require("../models/salle.model");
const seanceModel = require("../models/seance.model");
const cohorteModel = require("../models/cohorte.model");
const maintenanceModel = require("../models/maintenance.model");
const reservationModel = require("../models/reservation.model");
const conflitModel = require("../models/conflit.model");
const historiqueService = require("./historique.service");

const PRIORITY_MAP = {
  EXAMEN: 100,
  CM: 80,
  TD: 60,
  TP: 50,
  EVENEMENT: 40,
  REUNION: 30,
};

function buildDateRangeFromSeance(seance) {
  const start = new Date(`${seance.dateSeance}T${seance.heureDebut}:00`);

  if (Number.isNaN(start.getTime())) {
    throw new ApiError(400, "Date ou heure de séance invalide");
  }

  const duree = Number(seance.duree);
  if (!Number.isInteger(duree) || duree <= 0) {
    throw new ApiError(400, "Durée de séance invalide");
  }

  const end = new Date(start.getTime() + duree * 60000);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

async function saveConflit({
  type,
  description,
  reservation_id = null,
  seance_id_1 = null,
  seance_id_2 = null,
}) {
  try {
    await conflitModel.create({
      type,
      description,
      reservation_id,
      seance_id_1,
      seance_id_2,
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du conflit :", error.message);
  }
}

exports.createReservation = async ({
  salle_id,
  seance_id,
  created_by = null,
  motif = null,
}) => {
  const salle = await salleModel.findById(salle_id);
  if (!salle) throw new ApiError(404, "Salle introuvable");

  const seance = await seanceModel.findById(seance_id);
  if (!seance) throw new ApiError(404, "Séance introuvable");

  if (seance.statut === "ANNULE") {
    throw new ApiError(400, "Impossible de réserver une séance annulée");
  }

  const cohorte = await cohorteModel.findById(seance.cohorte_id);
  if (!cohorte) throw new ApiError(404, "Cohorte introuvable");

  if (salle.capacite < cohorte.effectif) {
    await saveConflit({
      type: "CAPACITE",
      description: `Capacité insuffisante pour la séance ${seance_id} dans la salle ${salle_id}`,
      seance_id_1: seance_id,
    });

    throw new ApiError(409, "Capacité insuffisante", {
      capaciteSalle: salle.capacite,
      effectifCohorte: cohorte.effectif,
    });
  }

  const { startIso, endIso } = buildDateRangeFromSeance(seance);

  const maintenance = await maintenanceModel.findOverlap(salle_id, startIso, endIso);
  if (maintenance) {
    await saveConflit({
      type: "MAINTENANCE",
      description: `Salle ${salle_id} en maintenance sur le créneau de la séance ${seance_id}`,
      seance_id_1: seance_id,
    });

    throw new ApiError(409, "Salle en maintenance sur ce créneau", maintenance);
  }

  const [confSalle, confCohorte, confEnseignant] = await Promise.all([
    reservationModel.findSalleConflicts(salle_id, startIso, endIso),
    reservationModel.findCohorteConflicts(seance.cohorte_id, startIso, endIso),
    reservationModel.findEnseignantConflicts(seance.enseignant_id, startIso, endIso),
  ]);

  if (confSalle.length || confCohorte.length || confEnseignant.length) {
    const alternatives = await reservationModel.findAlternativeSalles({
      excludeSalleId: salle.id,
      type: salle.type,
      effectif: cohorte.effectif,
      pmr: salle.accessibilitePMR,
      startIso,
      endIso,
      limit: 5,
    });

    await saveConflit({
      type: "CONFLIT_RESERVATION",
      description: `Conflit détecté pour la séance ${seance_id} dans la salle ${salle_id}`,
      seance_id_1: seance_id,
    });

    throw new ApiError(409, "Conflit détecté", {
      conflicts: {
        salle: confSalle.map((x) => x.id),
        cohorte: confCohorte.map((x) => x.id),
        enseignant: confEnseignant.map((x) => x.id),
      },
      alternatives,
    });
  }

  const priorite = PRIORITY_MAP[seance.typeSeance] ?? 10;

  const r = await reservationModel.create({
    salle_id,
    seance_id,
    statut: "PLANIFIEE",
    priorite,
    demandeur_id: created_by,
    motif,
  });

  await historiqueService.logAction({
    auteur_id: created_by,
    entite: "Reservation",
    entite_id: r.lastID,
    action: "CREATE",
    detail: `Création de la réservation pour la séance ${seance_id} dans la salle ${salle_id}`,
  });

  return {
    id: r.lastID,
    statut: "PLANIFIEE",
    priorite,
    message: "Réservation créée avec succès",
  };
};

exports.updateReservation = async (
  reservationId,
  { salle_id, seance_id, motif },
  userId = null
) => {
  const existing = await reservationModel.findById(reservationId);
  if (!existing) throw new ApiError(404, "Réservation introuvable");

  const finalSalleId = salle_id ?? existing.salle_id;
  const finalSeanceId = seance_id ?? existing.seance_id;
  const finalMotif = motif ?? existing.motif;
  const finalStatut = existing.statut;

  const salle = await salleModel.findById(finalSalleId);
  if (!salle) throw new ApiError(404, "Salle introuvable");

  const seance = await seanceModel.findById(finalSeanceId);
  if (!seance) throw new ApiError(404, "Séance introuvable");

  if (seance.statut === "ANNULE") {
    throw new ApiError(400, "Impossible d'affecter une réservation à une séance annulée");
  }

  const cohorte = await cohorteModel.findById(seance.cohorte_id);
  if (!cohorte) throw new ApiError(404, "Cohorte introuvable");

  if (salle.capacite < cohorte.effectif) {
    await saveConflit({
      type: "CAPACITE",
      description: `Capacité insuffisante lors de la mise à jour de la réservation ${reservationId}`,
      reservation_id: reservationId,
      seance_id_1: finalSeanceId,
    });

    throw new ApiError(409, "Capacité insuffisante", {
      capaciteSalle: salle.capacite,
      effectifCohorte: cohorte.effectif,
    });
  }

  const { startIso, endIso } = buildDateRangeFromSeance(seance);

  const maintenance = await maintenanceModel.findOverlap(finalSalleId, startIso, endIso);
  if (maintenance) {
    await saveConflit({
      type: "MAINTENANCE",
      description: `Salle ${finalSalleId} en maintenance lors de la mise à jour de la réservation ${reservationId}`,
      reservation_id: reservationId,
      seance_id_1: finalSeanceId,
    });

    throw new ApiError(409, "Salle en maintenance sur ce créneau", maintenance);
  }

  const [confSalle, confCohorte, confEnseignant] = await Promise.all([
    reservationModel.findSalleConflicts(finalSalleId, startIso, endIso, reservationId),
    reservationModel.findCohorteConflicts(seance.cohorte_id, startIso, endIso, reservationId),
    reservationModel.findEnseignantConflicts(seance.enseignant_id, startIso, endIso, reservationId),
  ]);

  if (confSalle.length || confCohorte.length || confEnseignant.length) {
    const alternatives = await reservationModel.findAlternativeSalles({
      excludeSalleId: salle.id,
      type: salle.type,
      effectif: cohorte.effectif,
      pmr: salle.accessibilitePMR,
      startIso,
      endIso,
      limit: 5,
    });

    await saveConflit({
      type: "CONFLIT_RESERVATION_UPDATE",
      description: `Conflit détecté lors de la mise à jour de la réservation ${reservationId}`,
      reservation_id: reservationId,
      seance_id_1: finalSeanceId,
    });

    throw new ApiError(409, "Conflit détecté", {
      conflicts: {
        salle: confSalle.map((x) => x.id),
        cohorte: confCohorte.map((x) => x.id),
        enseignant: confEnseignant.map((x) => x.id),
      },
      alternatives,
    });
  }

  await reservationModel.update(reservationId, {
    salle_id: finalSalleId,
    seance_id: finalSeanceId,
    statut: finalStatut,
    motif: finalMotif,
  });

  await historiqueService.logAction({
    auteur_id: userId,
    entite: "Reservation",
    entite_id: reservationId,
    action: "UPDATE",
    detail: `Mise à jour de la réservation ${reservationId} vers la salle ${finalSalleId} et la séance ${finalSeanceId}`,
  });

  return {
    message: "Réservation mise à jour",
    id: reservationId,
  };
};

exports.cancelReservation = async (reservationId, userId = null) => {
  const existing = await reservationModel.findById(reservationId);
  if (!existing) throw new ApiError(404, "Réservation introuvable");

  await reservationModel.updateStatus(reservationId, "ANNULEE");

  await historiqueService.logAction({
    auteur_id: userId,
    entite: "Reservation",
    entite_id: reservationId,
    action: "CANCEL",
    detail: `Annulation de la réservation ${reservationId}`,
  });

  return {
    message: "Réservation annulée",
    id: reservationId,
  };
};