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
    // 🚀 ON AJOUTE 'resolu' ET LA VALEUR 0 DANS LE SQL
    await dbRun(
      `INSERT INTO Conflit (type, description, reservation_id, seance_id_1, seance_id_2, resolu)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [type, description, reservation_id, seance_id_1, seance_id_2]
    );
  } catch (error) {
    console.error("Erreur enregistrement conflit :", error.message);
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
    if (!salle) throw new ApiError(404, "Salle introuvable");
  }

  // ==========================================
  // BLOC MODIFICATION
  // ==========================================
  if (type_demande === "MODIFICATION") {
    if (!seance_id) throw new ApiError(400, "seance_id est obligatoire");

    const seance = await findSeanceById(seance_id);
    if (!seance) throw new ApiError(404, "Séance introuvable");
    if (seance.statut === "ANNULE") throw new ApiError(400, "Séance annulée");

    const existingReservation = await reservationModel.findActiveBySeance(seance_id);
    if (existingReservation) throw new ApiError(409, "Réservation déjà active");

    const cohorte = await findCohorteById(seance.cohorte_id);
    if (salle && salle.capacite < cohorte.effectif) {
      await saveConflit({ type: "CAPACITE", description: "Capacité insuffisante", seance_id_1: seance_id });
      throw new ApiError(409, "Capacité insuffisante");
    }

    const { startSql, endSql } = buildDateRange({
      dateSeance: date_souhaitee || seance.dateSeance,
      heureDebut: heure_debut_souhaitee || seance.heureDebut,
      duree: duree_souhaitee || seance.duree,
    });

    if (salle) {
      const maintenance = await findMaintenanceOverlap(salle_id, startSql, endSql);
      if (maintenance) {
        await saveConflit({ type: "MAINTENANCE", description: "Salle en maintenance", seance_id_1: seance_id });
        throw new ApiError(409, "Salle en maintenance", maintenance);
      }

      const [confSalle, confCohorte, confEnseignant] = await Promise.all([
        reservationModel.findSalleConflicts(salle_id, startSql, endSql, seance_id),
        reservationModel.findCohorteConflicts(seance.cohorte_id, startSql, endSql, seance_id),
        reservationModel.findEnseignantConflicts(seance.enseignant_id, startSql, endSql, seance_id),
      ]);

      if (confSalle.length || confCohorte.length || confEnseignant.length) {
        const prioriteNouvelle = PRIORITY_MAP[type_seance_souhaitee || seance.typeSeance] ?? 10;
        const allConflicts = [...confSalle, ...confCohorte, ...confEnseignant];
        const prioriteExistanteMax = Math.max(...allConflicts.map(c => PRIORITY_MAP[c.typeSeance] ?? 10));

        // 🧠 SYSTÈME DE PRIORITÉ POUR MODIFICATION
        if (prioriteNouvelle > prioriteExistanteMax) {
          const priorite = PRIORITY_MAP[seance.typeSeance] ?? 10;
          const result = await reservationModel.create({
            type_demande, seance_id, salle_id, demandeur_id: created_by, cohorte_id: seance.cohorte_id,
            enseignant_id: seance.enseignant_id, statut: "EN_ATTENTE", priorite, motif,
            date_souhaitee, heure_debut_souhaitee, duree_souhaitee, type_seance_souhaitee,
          });

          // 🚀 RECUPERATION SECURISEE
          const newResaId = result.lastID || result.id || result;

          await saveConflit({
            type: "PRIORITE",
            description: `⚠️ Une demande prioritaire (${type_seance_souhaitee || seance.typeSeance}) s'impose sur un créneau. Arbitrage Admin requis.`,
            reservation_id: newResaId, 
            seance_id_1: allConflicts[0].id
          });
          return { id: newResaId, message: "Demande prioritaire envoyée avec succès ! En attente d'arbitrage." };
        } else {
          const alternatives = await reservationModel.findAlternativeSalles({
            excludeSalleId: salle.id, type: salle.type, effectif: cohorte.effectif, pmr: salle.accessibilitePMR, limit: 5,
          });
          await saveConflit({ type: "CONFLIT_RESERVATION", description: `Créneau occupé.`, seance_id_1: seance_id });
          throw new ApiError(409, "Créneau déjà occupé par un cours de priorité égale ou supérieure.", { alternatives });
        }
      }
    }

    // Création normale si aucun conflit
    const priorite = PRIORITY_MAP[seance.typeSeance] ?? 10;
    const result = await reservationModel.create({
      type_demande, seance_id, salle_id, demandeur_id: created_by, cohorte_id: seance.cohorte_id,
      enseignant_id: seance.enseignant_id, statut: "EN_ATTENTE", priorite, motif,
      date_souhaitee, heure_debut_souhaitee, duree_souhaitee, type_seance_souhaitee,
    });
    
    const finalId = result.lastID || result.id || result;
    return { id: finalId, message: "Demande de modification créée avec succès" };
  }

  // ==========================================
  // BLOC AJOUT
  // ==========================================
  if (!date_souhaitee || !heure_debut_souhaitee || !duree_souhaitee || !type_seance_souhaitee || !cohorte_id || !enseignant_id) {
    throw new ApiError(400, "Champs requis manquants");
  }

  const cohorte = await findCohorteById(cohorte_id);
  if (salle && salle.capacite < cohorte.effectif) {
    throw new ApiError(409, "Capacité insuffisante");
  }

  const { startSql, endSql } = buildDateRange({
    dateSeance: date_souhaitee, heureDebut: heure_debut_souhaitee, duree: duree_souhaitee,
  });

  if (salle) {
    const maintenance = await findMaintenanceOverlap(salle_id, startSql, endSql);
    if (maintenance) throw new ApiError(409, "Salle en maintenance", maintenance);

    const [confSalle, confCohorte, confEnseignant] = await Promise.all([
      reservationModel.findSalleConflicts(salle_id, startSql, endSql),
      reservationModel.findCohorteConflicts(cohorte_id, startSql, endSql),
      reservationModel.findEnseignantConflicts(enseignant_id, startSql, endSql),
    ]);

    if (confSalle.length || confCohorte.length || confEnseignant.length) {
      const prioriteNouvelle = PRIORITY_MAP[type_seance_souhaitee] ?? 10;
      const allConflicts = [...confSalle, ...confCohorte, ...confEnseignant];
      const prioriteExistanteMax = Math.max(...allConflicts.map(c => PRIORITY_MAP[c.typeSeance] ?? 10));

      // 🧠 SYSTÈME DE PRIORITÉ POUR L'AJOUT
      if (prioriteNouvelle > prioriteExistanteMax) {
        const priorite = PRIORITY_MAP[type_seance_souhaitee] ?? 10;
        const result = await reservationModel.create({
          type_demande, seance_id: null, salle_id, demandeur_id: created_by, date_souhaitee, heure_debut_souhaitee,
          duree_souhaitee, type_seance_souhaitee, cohorte_id, enseignant_id, statut: "EN_ATTENTE", priorite, motif,
        });

        // 🚀 RECUPERATION SECURISEE
        const newResaId = result.lastID || result.id || result;

        await saveConflit({
          type: "PRIORITE",
          description: `⚠️ Un nouvel événement prioritaire (${type_seance_souhaitee}) s'impose sur un créneau occupé. Arbitrage Admin requis.`,
          reservation_id: newResaId, 
          seance_id_1: allConflicts[0].id 
        });
        return { id: newResaId, message: "Demande prioritaire envoyée avec succès ! En attente d'arbitrage." };
      } else {
        const alternatives = await reservationModel.findAlternativeSalles({
          excludeSalleId: salle.id, type: salle.type, effectif: cohorte.effectif, pmr: salle.accessibilitePMR, limit: 5,
        });
        await saveConflit({ type: "CONFLIT_AJOUT", description: `Le créneau est occupé.` });
        throw new ApiError(409, "Créneau déjà occupé par un cours de priorité égale ou supérieure.", { alternatives });
      }
    }
  }

  // Création normale si aucun conflit
  const priorite = PRIORITY_MAP[type_seance_souhaitee] ?? 10;
  const result = await reservationModel.create({
    type_demande, seance_id: null, salle_id, demandeur_id: created_by, date_souhaitee, heure_debut_souhaitee,
    duree_souhaitee, type_seance_souhaitee, cohorte_id, enseignant_id, statut: "EN_ATTENTE", priorite, motif,
  });

  const finalId = result.lastID || result.id || result;
  return { id: finalId, message: "Demande d'ajout créée avec succès" };
};
exports.updateReservation = async (reservationId, payload, userId = null) => {
  const existing = await reservationModel.findById(reservationId);
  if (!existing) {
    throw new ApiError(404, "Réservation introuvable");
  }

  // 🚀 LE COUPE-FILE (Validation par l'Admin)
  if (payload.statut && !payload.date_souhaitee && !payload.salle_id) {
    
    // CAS 1 : Validation d'un AJOUT
    // ✅ VERSION CORRIGÉE (Ligne 160 environ)
    if (payload.statut === "VALIDEE" && !existing.seance_id && existing.type_demande === "AJOUT") {
      const newSeance = await dbRun(
        `INSERT INTO Seance (dateSeance, heureDebut, duree, typeSeance, statut, description, cohorte_id, enseignant_id, salle_id) 
        VALUES (?, ?, ?, ?, 'VALIDE', ?, ?, ?, ?)`, // 🚀 ICI : 'VALIDE' au lieu de 'PLANIFIE'
        [
          existing.date_souhaitee,
          existing.heure_debut_souhaitee,
          existing.duree_souhaitee,
          existing.type_seance_souhaitee,
          existing.motif || "Généré depuis une réservation",
          existing.cohorte_id,
          existing.enseignant_id,
          existing.salle_id
        ]
      );
      
      const generatedId = newSeance.lastID || newSeance.id;
      await dbRun("UPDATE Reservation SET seance_id = ?, statut = 'VALIDEE' WHERE id = ?", [generatedId, reservationId]);
    }
    // CAS 2 : Validation d'un DÉPLACEMENT (MODIFICATION)
    else if (payload.statut === "VALIDEE" && existing.seance_id && existing.type_demande === "MODIFICATION") {
      await dbRun(
        `UPDATE Seance 
         SET dateSeance = ?, heureDebut = ?, duree = ? 
         WHERE id = ?`,
        [
          existing.date_souhaitee,
          existing.heure_debut_souhaitee,
          existing.duree_souhaitee,
          existing.seance_id
        ]
      );
    }

    // Mise à jour finale du statut de la demande
    await reservationModel.updateStatus(reservationId, payload.statut);
    
    await historiqueService.logAction({
      auteur_id: userId,
      entite: "Reservation",
      entite_id: reservationId,
      action: "UPDATE_STATUS",
      detail: `Statut passé à ${payload.statut} pour la réservation ${reservationId}`,
    });

    return { message: "Statut mis à jour avec succès", id: reservationId };
  }

  // LOGIQUE DE MISE À JOUR CLASSIQUE
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

    const priorite = PRIORITY_MAP[seance.typeSeance] ?? 10;

    await reservationModel.update(reservationId, {
      ...data,
      cohorte_id: seance.cohorte_id,
      enseignant_id: seance.enseignant_id,
      priorite,
    });
  } else {
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