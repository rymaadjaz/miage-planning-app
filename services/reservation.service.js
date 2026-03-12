const ApiError = require("../utils/ApiError");
const { dbExec, dbAll } = require("../db/dbAsync");

const salleModel = require("../models/salle.model");
const seanceModel = require("../models/seance.model");
const cohorteModel = require("../models/cohorte.model");
const maintenanceModel = require("../models/maintenance.model");
const reservationModel = require("../models/reservation.model");

const PRIORITY_MAP = {
  EXAMEN: 100,
  CM: 80,
  TD: 60,
  TP: 50,
  EVENEMENT: 40,
  REUNION: 30,
};

function toIso(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, "Date invalide (ISO recommandé)");
  return d.toISOString();
}

// Démarrage de la transaction
async function beginTx() {
  await dbExec("BEGIN IMMEDIATE TRANSACTION;");
  console.log("Transaction commencée");
}


async function commitTx() {
  await dbExec("COMMIT;");
  console.log("Transaction validée");
}


async function rollbackTx() {
  try {
    await dbExec("ROLLBACK;");
    console.log("Transaction annulée");
  } catch (error) {
    console.error("Erreur lors du rollback : ", error.message);
  }
}

// Création d'une réservation
exports.createReservation = async ({ salle_id, seance_id, heure_debut, heure_fin, created_by = null }) => {
  const startIso = toIso(heure_debut);
  const endIso = toIso(heure_fin);

  // Vérification de la validité des horaires
  if (new Date(endIso) <= new Date(startIso)) throw new ApiError(400, "Heure fin invalide");

  await beginTx();
  try {
    // Récupérer la salle
    const salle = await salleModel.findById(salle_id);
    if (!salle) throw new ApiError(404, "Salle introuvable");

    // Récupérer la séance
    const seance = await seanceModel.findById(seance_id);
    if (!seance) throw new ApiError(404, "Séance introuvable");

    // Récupérer la cohorte
    const cohorte = await cohorteModel.findById(seance.cohorte_id);
    if (!cohorte) throw new ApiError(404, "Cohorte introuvable");

    
    if (salle.capacite < cohorte.effectif) {
      throw new ApiError(409, "Capacité insuffisante", {
        capaciteSalle: salle.capacite,
        effectifCohorte: cohorte.effectif,
      });
    }

 
    const maintenance = await maintenanceModel.findOverlap(salle_id, startIso, endIso);
    if (maintenance) throw new ApiError(409, "Salle en maintenance sur ce créneau", maintenance);

   
    const [confSalle, confCohorte, confEnseignant] = await Promise.all([
      reservationModel.findSalleConflicts(salle_id, startIso, endIso),
      reservationModel.findCohorteConflicts(seance.cohorte_id, startIso, endIso),
      reservationModel.findEnseignantConflicts(seance.enseignant_id, startIso, endIso),
    ]);

    if (confSalle.length || confCohorte.length || confEnseignant.length) {
    
      console.log(`Conflits détectés : Salle ${confSalle.length}, Cohorte ${confCohorte.length}, Enseignant ${confEnseignant.length}`);
      
      const alternatives = await reservationModel.findAlternativeSalles({
        excludeSalleId: salle.id,
        type: salle.type,
        effectif: cohorte.effectif,
        pmr: salle.accessiblePMR,
        startIso,
        endIso,
        limit: 5,
      });

      // Erreur avec les conflits et alternatives proposées
      throw new ApiError(409, "Conflit détecté", {
        conflicts: {
          salle: confSalle.map((x) => x.id),
          cohorte: confCohorte.map((x) => x.id),
          enseignant: confEnseignant.map((x) => x.id),
        },
        alternatives,
      });
    }

    // Calcul de la priorité de la réservation
    const priorite = PRIORITY_MAP[seance.type] ?? 10;

    // Création de la réservation dans la base de données
    const r = await reservationModel.create({
      salle_id,
      seance_id,
      heure_debut: startIso,
      heure_fin: endIso,
      statut: "PLANIFIEE",
      priorite,
      created_by,
    });

    await commitTx();
    console.log("Réservation créée avec succès");
    return { id: r.lastID, statut: "PLANIFIEE", priorite };
  } catch (e) {
    await rollbackTx();
    console.error("Erreur lors de la création de la réservation : ", e.message);
    throw e;
  }
};

// Mise à jour d'une réservation
exports.updateReservation = async (reservationId, { salle_id, heure_debut, heure_fin }) => {
  const startIso = toIso(heure_debut);
  const endIso = toIso(heure_fin);

  // Vérification des horaires
  if (new Date(endIso) <= new Date(startIso)) throw new ApiError(400, "Heure fin invalide");

  await beginTx();
  try {
    // Vérification de la réservation existante
    const existing = await reservationModel.findById(reservationId);
    if (!existing) throw new ApiError(404, "Réservation introuvable");

    // Vérification de la salle
    const salle = await salleModel.findById(salle_id);
    if (!salle) throw new ApiError(404, "Salle introuvable");

    // Vérification de la séance et de la cohorte
    const seance = await seanceModel.findById(existing.seance_id);
    if (!seance) throw new ApiError(404, "Séance introuvable");

    const cohorte = await cohorteModel.findById(seance.cohorte_id);
    if (!cohorte) throw new ApiError(404, "Cohorte introuvable");

    // Vérification de la capacité
    if (salle.capacite < cohorte.effectif) {
      throw new ApiError(409, "Capacité insuffisante", {
        capaciteSalle: salle.capacite,
        effectifCohorte: cohorte.effectif,
      });
    }

    // Vérification de la maintenance
    const maintenance = await maintenanceModel.findOverlap(salle_id, startIso, endIso);
    if (maintenance) throw new ApiError(409, "Salle en maintenance sur ce créneau");

    // Détection des conflits lors de la mise à jour
    const [confSalle, confCohorte, confEnseignant] = await Promise.all([
      reservationModel.findSalleConflicts(salle_id, startIso, endIso, reservationId),
      reservationModel.findCohorteConflicts(seance.cohorte_id, startIso, endIso, reservationId),
      reservationModel.findEnseignantConflicts(seance.enseignant_id, startIso, endIso, reservationId),
    ]);

    if (confSalle.length || confCohorte.length || confEnseignant.length) {
      // Log des conflits détectés
      console.log(`Conflits détectés lors de la mise à jour : Salle ${confSalle.length}, Cohorte ${confCohorte.length}, Enseignant ${confEnseignant.length}`);

      // Proposition d'alternatives
      const alternatives = await reservationModel.findAlternativeSalles({
        excludeSalleId: salle.id,
        type: salle.type,
        effectif: cohorte.effectif,
        pmr: salle.accessiblePMR,
        startIso,
        endIso,
        limit: 5,
      });

      // Erreur avec les conflits et alternatives proposées
      throw new ApiError(409, "Conflit détecté", {
        conflicts: {
          salle: confSalle.map((x) => x.id),
          cohorte: confCohorte.map((x) => x.id),
          enseignant: confEnseignant.map((x) => x.id),
        },
        alternatives,
      });
    }

    await reservationModel.updateTimes(reservationId, {
      salle_id,
      heure_debut: startIso,
      heure_fin: endIso,
    });

    await commitTx();
    console.log("Réservation mise à jour avec succès");
    return { message: "Réservation mise à jour", id: reservationId };
  } catch (e) {
    await rollbackTx();
    console.error("Erreur lors de la mise à jour de la réservation : ", e.message);
    throw e;
  }
};
exports.cancelReservation = async (reservationId) => {
  const existing = await reservationModel.findById(reservationId);
  if (!existing) throw new ApiError(404, "Réservation introuvable");

  await reservationModel.updateStatus(reservationId, "ANNULEE");
  console.log("Réservation annulée avec succès");
  return { message: "Réservation annulée", id: reservationId };
};