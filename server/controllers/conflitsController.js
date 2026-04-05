const ApiError = require("../utils/ApiError");
const conflitModel = require("../models/conflit.model");
const { dbGet, dbRun, dbAll } = require("../db/dbAsync");

exports.getAll = async (_req, res) => {
  const rows = await conflitModel.findAll();
  res.json(rows);
};

exports.getUnresolved = async (_req, res) => {
  const rows = await conflitModel.findUnresolved();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id conflit invalide");
  }

  const row = await conflitModel.findById(id);

  if (!row) {
    throw new ApiError(404, "Conflit introuvable");
  }

  res.json(row);
};

exports.resolve = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id conflit invalide");
  }

  const existing = await conflitModel.findById(id);

  if (!existing) {
    throw new ApiError(404, "Conflit introuvable");
  }

  await conflitModel.markResolved(id);

  res.json({
    message: "Conflit marqué comme résolu",
    id,
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id conflit invalide");
  }

  const existing = await conflitModel.findById(id);

  if (!existing) {
    throw new ApiError(404, "Conflit introuvable");
  }

  await conflitModel.remove(id);

  res.json({
    message: "Conflit supprimé",
    id,
  });
};




exports.trancherConflit = async (req, res) => {
  const { id } = req.params; 
  
  console.log("📥 DONNÉES REÇUES DU FRONTEND :", req.body);

  // 🚀 LA CORRECTION EST ICI : On accepte tous les noms de variables possibles !
  const rawExamId = req.body.reservation_exam_id || req.body.reservation_id || req.body.examenAReserver;
  const rawOldSeanceId = req.body.seance_old_id || req.body.seance_id_1 || req.body.coursA_Deplacer;
  
  const examId = Number(rawExamId);
  const oldSeanceId = Number(rawOldSeanceId);
  const { nouvelleDate, nouvelleHeure } = req.body;

  try {
    // Sécurité Anti-NaN
    if (!rawExamId || isNaN(examId)) {
      throw new Error(`L'ID de réservation est introuvable ou invalide. Le frontend a envoyé : ${JSON.stringify(req.body)}`);
    }

    console.log(`🔍 Recherche de la réservation ID: ${examId}...`);
    const resaExam = await dbGet("SELECT * FROM Reservation WHERE id = ?", [examId]);
    
    if (!resaExam) {
      throw new Error(`Réservation ${examId} introuvable en base de données.`);
    }

    const seanceOld = await dbGet("SELECT * FROM Seance WHERE id = ?", [oldSeanceId]);
    const matiereId = resaExam.matiere_id || (seanceOld ? seanceOld.matiere_id : null);

    console.log("🔨 Création de la séance d'examen sur l'EDT...");
    const resultInsert = await dbRun(
      `INSERT INTO Seance (dateSeance, heureDebut, duree, typeSeance, statut, description, cohorte_id, enseignant_id, salle_id, matiere_id) 
       VALUES (?, ?, ?, ?, 'VALIDE', ?, ?, ?, ?, ?)`, 
      [
        resaExam.date_souhaitee, 
        resaExam.heure_debut_souhaitee, 
        resaExam.duree_souhaitee, 
        resaExam.type_seance_souhaitee, 
        resaExam.motif || "Examen prioritaire (Arbitrage)", 
        resaExam.cohorte_id, 
        resaExam.enseignant_id,
        resaExam.salle_id, 
        matiereId
      ]
    );

    const newSeanceId = resultInsert.lastID || resultInsert.id;

    await dbRun(
      "UPDATE Reservation SET statut = 'VALIDEE', seance_id = ? WHERE id = ?", 
      [newSeanceId, examId]
    );

    if (oldSeanceId) {
      if (nouvelleDate && nouvelleHeure) {
        await dbRun(
          "UPDATE Seance SET dateSeance = ?, heureDebut = ?, statut = 'VALIDE' WHERE id = ?", 
          [nouvelleDate, nouvelleHeure, oldSeanceId]
        );
        await dbRun(
          "UPDATE Reservation SET date_souhaitee = ?, heure_debut_souhaitee = ?, statut = 'VALIDEE' WHERE seance_id = ?", 
          [nouvelleDate, nouvelleHeure, oldSeanceId]
        );
      } else {
        await dbRun("UPDATE Seance SET statut = 'ANNULE' WHERE id = ?", [oldSeanceId]);
        await dbRun("UPDATE Reservation SET statut = 'ANNULEE' WHERE seance_id = ?", [oldSeanceId]);
      }
    }

    await dbRun("UPDATE Conflit SET resolu = 1 WHERE id = ?", [id]);
    
    console.log("🎉 ARBITRAGE TERMINÉ AVEC SUCCÈS !");
    res.json({ message: "Arbitrage réussi ! L'emploi du temps a été mis à jour." });

  } catch (error) {
    console.error("❌ ERREUR API ARBITRAGE :", error.message);
    res.status(500).json({ message: error.message });
  }
};