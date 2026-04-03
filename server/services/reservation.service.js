const ApiError = require("../utils/ApiError");
const { dbGet, dbRun } = require("../db/dbAsync");
const reservationModel = require("../models/reservation.model");
const historiqueService = require("./historique.service");

const PRIORITY_MAP = {
  EXAMEN: 100,
  CM: 80,
  TD: 60,
  TP: 50,
  EVENEMENT: 40,
  REUNION: 30,
};

function formatDateForSql(date) {
  const pad = (n) => String(n).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    " ",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
  ].join("");
}

function buildDateRange({ dateSeance, heureDebut, duree }) {
  const start = new Date(`${dateSeance}T${heureDebut}:00`);

  if (Number.isNaN(start.getTime())) {
    throw new ApiError(400, "Date ou heure invalide");
  }

  const d = Number(duree);
  if (!Number.isInteger(d) || d <= 0) {
    throw new ApiError(400, "Durée invalide");
  }

  const end = new Date(start.getTime() + d * 60000);

  return {
    startSql: formatDateForSql(start),
    endSql: formatDateForSql(end),
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
    await dbRun(
      `
      INSERT INTO Conflit (type, description, reservation_id, seance_id_1, seance_id_2)
      VALUES (?, ?, ?, ?, ?)
      `,
      [type, description, reservation_id, seance_id_1, seance_id_2]
    );
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du conflit :", error.message);
  }
}

async function findSalleById(id) {
  return dbGet(`SELECT * FROM Salle WHERE id = ?`, [id]);
}

async function findSeanceById(id) {
  return dbGet(`SELECT * FROM Seance WHERE id = ?`, [id]);
}

async function findCohorteById(id) {
  return dbGet(`SELECT * FROM Cohorte WHERE id = ?`, [id]);
}

async function findMaintenanceOverlap(salleId, startSql, endSql) {
  return dbGet(
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
}

exports.createReservation = async ({
  type_demande = "MODIFICATION",
  salle_id = null,
  seance_id = null,
  created_by = null,
  motif = null,
  date_souhaitee = null,
  heure_debut_souhaitee = null,
  duree_souhaitee = null,
  type_seance_souhaitee = null,
  cohorte_id = null,
  enseignant_id = null,
}) => {
  if (!["MODIFICATION", "AJOUT"].includes(type_demande)) {
    throw new ApiError(400, "type_demande invalide");
  }

  let salle = null;
  if (salle_id) {
    salle = await findSalleById(salle_id);
    if (!salle) {
      throw new ApiError(404, "Salle introuvable");
    }
  }

  if (type_demande === "MODIFICATION") {
    if (!seance_id) {
      throw new ApiError(400, "seance_id est obligatoire pour une demande de modification");
    }

    const seance = await findSeanceById(seance_id);
    if (!seance) {
      throw new ApiError(404, "Séance introuvable");
    }

    if (seance.statut === "ANNULE") {
      throw new ApiError(400, "Impossible de faire une demande sur une séance annulée");
    }

    const existingReservation = await reservationModel.findActiveBySeance(seance_id);
    if (existingReservation) {
      throw new ApiError(409, "Cette séance possède déjà une réservation active");
    }

    const cohorte = await findCohorteById(seance.cohorte_id);
    if (!cohorte) {
      throw new ApiError(404, "Cohorte introuvable");
    }

    if (salle && salle.capacite < cohorte.effectif) {
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

    const { startSql, endSql } = buildDateRange({
      dateSeance: seance.dateSeance,
      heureDebut: seance.heureDebut,
      duree: seance.duree,
    });

    if (salle) {
      const maintenance = await findMaintenanceOverlap(salle_id, startSql, endSql);
      if (maintenance) {
        await saveConflit({
          type: "MAINTENANCE",
          description: `Salle ${salle_id} en maintenance sur le créneau de la séance ${seance_id}`,
          seance_id_1: seance_id,
        });

        throw new ApiError(409, "Salle en maintenance sur ce créneau", maintenance);
      }

      const [confSalle, confCohorte, confEnseignant] = await Promise.all([
        reservationModel.findSalleConflicts(salle_id, startSql, endSql),
        reservationModel.findCohorteConflicts(seance.cohorte_id, startSql, endSql),
        reservationModel.findEnseignantConflicts(seance.enseignant_id, startSql, endSql),
      ]);

      if (confSalle.length || confCohorte.length || confEnseignant.length) {
        const alternatives = await reservationModel.findAlternativeSalles({
          excludeSalleId: salle.id,
          type: salle.type,
          effectif: cohorte.effectif,
          pmr: salle.accessibilitePMR,
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
    }

    const priorite = PRIORITY_MAP[seance.typeSeance] ?? 10;

    const result = await reservationModel.create({
      type_demande,
      seance_id,
      salle_id,
      demandeur_id: created_by,
      cohorte_id: seance.cohorte_id,
      enseignant_id: seance.enseignant_id,
      statut: "EN_ATTENTE",
      priorite,
      motif,
    });

    await historiqueService.logAction({
      auteur_id: created_by,
      entite: "Reservation",
      entite_id: result.lastID,
      action: "CREATE",
      detail: `Création d'une demande de modification pour la séance ${seance_id}`,
    });

    return {
      id: result.lastID,
      message: "Demande de modification créée avec succès",
    };
  }

  if (
    !date_souhaitee ||
    !heure_debut_souhaitee ||
    !duree_souhaitee ||
    !type_seance_souhaitee ||
    !cohorte_id ||
    !enseignant_id
  ) {
    throw new ApiError(400, "Champs requis manquants pour une demande d'ajout");
  }

  const cohorte = await findCohorteById(cohorte_id);
  if (!cohorte) {
    throw new ApiError(404, "Cohorte introuvable");
  }

  if (salle && salle.capacite < cohorte.effectif) {
    throw new ApiError(409, "Capacité insuffisante", {
      capaciteSalle: salle.capacite,
      effectifCohorte: cohorte.effectif,
    });
  }

  const { startSql, endSql } = buildDateRange({
    dateSeance: date_souhaitee,
    heureDebut: heure_debut_souhaitee,
    duree: duree_souhaitee,
  });

  if (salle) {
    const maintenance = await findMaintenanceOverlap(salle_id, startSql, endSql);
    if (maintenance) {
      throw new ApiError(409, "Salle en maintenance sur ce créneau", maintenance);
    }

    const [confSalle, confCohorte, confEnseignant] = await Promise.all([
      reservationModel.findSalleConflicts(salle_id, startSql, endSql),
      reservationModel.findCohorteConflicts(cohorte_id, startSql, endSql),
      reservationModel.findEnseignantConflicts(enseignant_id, startSql, endSql),
    ]);

    if (confSalle.length || confCohorte.length || confEnseignant.length) {
      const alternatives = await reservationModel.findAlternativeSalles({
        excludeSalleId: salle.id,
        type: salle.type,
        effectif: cohorte.effectif,
        pmr: salle.accessibilitePMR,
        limit: 5,
      });

      await saveConflit({
        type: "CONFLIT_AJOUT",
        description: `Conflit détecté pour la demande d'ajout sur la salle ${salle_id}`,
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
  }

  const priorite = PRIORITY_MAP[type_seance_souhaitee] ?? 10;

  const result = await reservationModel.create({
    type_demande,
    seance_id: null,
    salle_id,
    demandeur_id: created_by,
    date_souhaitee,
    heure_debut_souhaitee,
    duree_souhaitee,
    type_seance_souhaitee,
    cohorte_id,
    enseignant_id,
    statut: "EN_ATTENTE",
    priorite,
    motif,
  });

  await historiqueService.logAction({
    auteur_id: created_by,
    entite: "Reservation",
    entite_id: result.lastID,
    action: "CREATE",
    detail: `Création d'une demande d'ajout pour la cohorte ${cohorte_id}`,
  });

  return {
    id: result.lastID,
    message: "Demande d'ajout créée avec succès",
  };
};

exports.updateReservation = async (reservationId, payload, userId = null) => {
  const existing = await reservationModel.findById(reservationId);
  if (!existing) {
    throw new ApiError(404, "Réservation introuvable");
  }

  const data = {
    type_demande: payload.type_demande ?? existing.type_demande,
    seance_id: payload.seance_id ?? existing.seance_id,
    salle_id: payload.salle_id ?? existing.salle_id,
    date_souhaitee: payload.date_souhaitee ?? existing.date_souhaitee,
    heure_debut_souhaitee: payload.heure_debut_souhaitee ?? existing.heure_debut_souhaitee,
    duree_souhaitee: payload.duree_souhaitee ?? existing.duree_souhaitee,
    type_seance_souhaitee: payload.type_seance_souhaitee ?? existing.type_seance_souhaitee,
    cohorte_id: payload.cohorte_id ?? existing.cohorte_id,
    enseignant_id: payload.enseignant_id ?? existing.enseignant_id,
    motif: payload.motif ?? existing.motif,
  };

  if (!["MODIFICATION", "AJOUT"].includes(data.type_demande)) {
    throw new ApiError(400, "type_demande invalide");
  }

  const salle = data.salle_id ? await findSalleById(data.salle_id) : null;
  if (data.salle_id && !salle) {
    throw new ApiError(404, "Salle introuvable");
  }

  if (data.type_demande === "MODIFICATION") {
    if (!data.seance_id) {
      throw new ApiError(400, "seance_id est obligatoire pour une demande de modification");
    }

    const seance = await findSeanceById(data.seance_id);
    if (!seance) {
      throw new ApiError(404, "Séance introuvable");
    }

    const duplicate = await reservationModel.findActiveBySeance(data.seance_id, reservationId);
    if (duplicate) {
      throw new ApiError(409, "Une autre réservation active existe déjà pour cette séance");
    }

    const priorite = PRIORITY_MAP[seance.typeSeance] ?? 10;

    await reservationModel.update(reservationId, {
      ...data,
      cohorte_id: seance.cohorte_id,
      enseignant_id: seance.enseignant_id,
      date_souhaitee: null,
      heure_debut_souhaitee: null,
      duree_souhaitee: null,
      type_seance_souhaitee: null,
      priorite,
    });
  } else {
    if (
      !data.date_souhaitee ||
      !data.heure_debut_souhaitee ||
      !data.duree_souhaitee ||
      !data.type_seance_souhaitee ||
      !data.cohorte_id ||
      !data.enseignant_id
    ) {
      throw new ApiError(400, "Champs requis manquants pour une demande d'ajout");
    }

    const priorite = PRIORITY_MAP[data.type_seance_souhaitee] ?? 10;

    await reservationModel.update(reservationId, {
      ...data,
      seance_id: null,
      priorite,
    });
  }

  await historiqueService.logAction({
    auteur_id: userId,
    entite: "Reservation",
    entite_id: reservationId,
    action: "UPDATE",
    detail: `Mise à jour de la réservation ${reservationId}`,
  });

  return {
    message: "Réservation mise à jour",
    id: reservationId,
  };
};

exports.cancelReservation = async (reservationId, userId = null) => {
  const existing = await reservationModel.findById(reservationId);
  if (!existing) {
    throw new ApiError(404, "Réservation introuvable");
  }

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