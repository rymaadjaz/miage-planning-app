const bcrypt = require("bcryptjs");
const { getDbConnection } = require("./database.js");

async function init() {
  let db;

  try {
    db = await getDbConnection();

    await db.exec(`
      CREATE TABLE IF NOT EXISTS Utilisateur (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        mot_de_passe TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('etudiant', 'enseignant', 'administratif')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Cohorte (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        effectif INTEGER NOT NULL DEFAULT 0 CHECK(effectif >= 0),
        niveau TEXT
      );

      CREATE TABLE IF NOT EXISTS Matiere (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        volumeHoraireTotal INTEGER DEFAULT 0 CHECK(volumeHoraireTotal >= 0)
      );

      CREATE TABLE IF NOT EXISTS Salle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        capacite INTEGER NOT NULL CHECK(capacite > 0),
        type TEXT NOT NULL CHECK(type IN ('AMPHI', 'TD', 'TP', 'LABO', 'INFO')),
        accessibilitePMR INTEGER NOT NULL DEFAULT 0 CHECK(accessibilitePMR IN (0,1)),
        isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1))
      );

      CREATE TABLE IF NOT EXISTS Equipement (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        salle_id INTEGER NOT NULL REFERENCES Salle(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS MaintenanceSalle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        salle_id INTEGER NOT NULL REFERENCES Salle(id) ON DELETE CASCADE,
        dateDebut TEXT NOT NULL,
        dateFin TEXT NOT NULL,
        description TEXT,
        statut TEXT NOT NULL DEFAULT 'PLANIFIEE'
          CHECK(statut IN ('PLANIFIEE','TERMINEE','ANNULEE')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Etudiant (
        id INTEGER PRIMARY KEY REFERENCES Utilisateur(id) ON DELETE CASCADE,
        numeroEtudiant TEXT NOT NULL UNIQUE,
        annee INTEGER,
        filiere TEXT,
        cohorte_id INTEGER REFERENCES Cohorte(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS Enseignant (
        id INTEGER PRIMARY KEY REFERENCES Utilisateur(id) ON DELETE CASCADE,
        grade TEXT,
        service TEXT
      );

      CREATE TABLE IF NOT EXISTS Disponibilite (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enseignant_id INTEGER NOT NULL REFERENCES Enseignant(id) ON DELETE CASCADE,
        jour TEXT NOT NULL CHECK(jour IN ('Lundi','Mardi','Mercredi','Jeudi','Vendredi')),
        heureDebut TEXT NOT NULL,
        heureFin TEXT NOT NULL,
        disponible INTEGER NOT NULL DEFAULT 1 CHECK(disponible IN (0,1))
      );

      CREATE TABLE IF NOT EXISTS Seance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dateSeance TEXT NOT NULL,
        heureDebut TEXT NOT NULL,
        duree INTEGER NOT NULL CHECK(duree > 0),
        typeSeance TEXT NOT NULL CHECK(typeSeance IN ('CM','TD','TP','EXAMEN','EVENEMENT','REUNION')),
        statut TEXT NOT NULL DEFAULT 'PLANIFIE'
          CHECK(statut IN ('PLANIFIE','VALIDE','ANNULE')),
        description TEXT,
        matiere_id INTEGER REFERENCES Matiere(id) ON DELETE SET NULL,
        cohorte_id INTEGER REFERENCES Cohorte(id) ON DELETE SET NULL,
        enseignant_id INTEGER REFERENCES Utilisateur(id) ON DELETE SET NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Reservation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type_demande TEXT NOT NULL DEFAULT 'MODIFICATION'
          CHECK(type_demande IN ('MODIFICATION', 'AJOUT')),
        seance_id INTEGER REFERENCES Seance(id) ON DELETE SET NULL,
        source_reservation_id INTEGER REFERENCES Reservation(id) ON DELETE SET NULL,
        salle_id INTEGER REFERENCES Salle(id) ON DELETE RESTRICT,
        demandeur_id INTEGER REFERENCES Utilisateur(id) ON DELETE SET NULL,
        date_souhaitee TEXT,
        heure_debut_souhaitee TEXT,
        duree_souhaitee INTEGER,
        type_seance_souhaitee TEXT
          CHECK(type_seance_souhaitee IN ('CM','TD','TP','EXAMEN','EVENEMENT','REUNION')),
        cohorte_id INTEGER REFERENCES Cohorte(id) ON DELETE SET NULL,
        enseignant_id INTEGER REFERENCES Utilisateur(id) ON DELETE SET NULL,
        priorite INTEGER NOT NULL DEFAULT 2,
        statut TEXT NOT NULL DEFAULT 'EN_ATTENTE'
          CHECK(statut IN ('PLANIFIEE','VALIDEE','ANNULEE','EN_ATTENTE')),
        motif TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Conflit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        resolu INTEGER NOT NULL DEFAULT 0 CHECK(resolu IN (0,1)),
        reservation_id INTEGER REFERENCES Reservation(id) ON DELETE SET NULL,
        seance_id_1 INTEGER REFERENCES Seance(id) ON DELETE CASCADE,
        seance_id_2 INTEGER REFERENCES Seance(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Historique (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        auteur_id INTEGER REFERENCES Utilisateur(id) ON DELETE SET NULL,
        entite TEXT NOT NULL,
        entite_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        detail TEXT,
        date_action DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Notification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL CHECK(role IN ('enseignant', 'etudiant', 'administratif')),
        status TEXT NOT NULL DEFAULT 'nouveau' CHECK(status IN ('nouveau', 'lu', 'important')),
        titre TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        iconType TEXT NOT NULL DEFAULT 'info' CHECK(iconType IN ('info', 'location', 'check', 'warning'))
      );
    `);

    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_reservation_updated_at
      AFTER UPDATE ON Reservation
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE Reservation
        SET updated_at = CURRENT_TIMESTAMP,
            version = OLD.version + 1
        WHERE id = NEW.id;
      END;
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_seance_cohorte ON Seance(cohorte_id);
      CREATE INDEX IF NOT EXISTS idx_seance_enseignant ON Seance(enseignant_id);
      CREATE INDEX IF NOT EXISTS idx_reservation_seance ON Reservation(seance_id);
      CREATE INDEX IF NOT EXISTS idx_reservation_source ON Reservation(source_reservation_id);
      CREATE INDEX IF NOT EXISTS idx_reservation_salle ON Reservation(salle_id);
      CREATE INDEX IF NOT EXISTS idx_reservation_statut ON Reservation(statut);
      CREATE INDEX IF NOT EXISTS idx_notification_role ON Notification(role);
    `);

    const userCount = await db.get("SELECT COUNT(*) AS total FROM Utilisateur");

    if (userCount.total === 0) {
      const defaultPassword = await bcrypt.hash("changeme", 10);

      await db.run(
        `
        INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, role) VALUES
        (?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?)
        `,
        [
          "Youssef", "Edris", "edris.youssef@univ.fr", defaultPassword, "etudiant",
          "Beduneau", "Jean", "prof.beduneau@univ.fr", defaultPassword, "enseignant",
          "AdminNom", "AdminPrenom", "admin.planning@univ.fr", defaultPassword, "administratif"
        ]
      );
    }

    const etuUser = await db.get(
      "SELECT id FROM Utilisateur WHERE email = ?",
      ["edris.youssef@univ.fr"]
    );
    const ensUser = await db.get(
      "SELECT id FROM Utilisateur WHERE email = ?",
      ["prof.beduneau@univ.fr"]
    );
    const adminUser = await db.get(
      "SELECT id FROM Utilisateur WHERE email = ?",
      ["admin.planning@univ.fr"]
    );

    const cohorteCount = await db.get("SELECT COUNT(*) AS total FROM Cohorte");
    if (cohorteCount.total === 0) {
      await db.run(`
        INSERT INTO Cohorte (nom, effectif, niveau) VALUES
        ('L3 MIAGE', 35, 'L3'),
        ('M1 Informatique', 28, 'M1')
      `);
    }

    const cohorteMiage = await db.get(
      "SELECT id FROM Cohorte WHERE nom = ?",
      ["L3 MIAGE"]
    );
    const cohorteM1 = await db.get(
      "SELECT id FROM Cohorte WHERE nom = ?",
      ["M1 Informatique"]
    );

    const ensCount = await db.get("SELECT COUNT(*) AS total FROM Enseignant");
    if (ensCount.total === 0 && ensUser) {
      await db.run(
        `INSERT INTO Enseignant (id, grade, service) VALUES (?, ?, ?)`,
        [ensUser.id, "MCF", "Informatique"]
      );
    }

    const etuCount = await db.get("SELECT COUNT(*) AS total FROM Etudiant");
    if (etuCount.total === 0 && etuUser && cohorteMiage) {
      await db.run(
        `INSERT INTO Etudiant (id, numeroEtudiant, annee, filiere, cohorte_id)
         VALUES (?, ?, ?, ?, ?)`,
        [etuUser.id, "E2026001", 3, "MIAGE", cohorteMiage.id]
      );
    }

    const salleCount = await db.get("SELECT COUNT(*) AS total FROM Salle");
    if (salleCount.total === 0) {
      await db.run(`
        INSERT INTO Salle (code, capacite, type, accessibilitePMR) VALUES
        ('A101', 40, 'TD', 1),
        ('B201', 120, 'AMPHI', 1),
        ('LAB1', 28, 'INFO', 0)
      `);
    }

    const matiereCount = await db.get("SELECT COUNT(*) AS total FROM Matiere");
    if (matiereCount.total === 0) {
      await db.run(`
        INSERT INTO Matiere (nom, volumeHoraireTotal) VALUES
        ('Génie Logiciel', 30),
        ('Bases de Données', 24),
        ('Réseaux', 20)
      `);
    }

    const matiereGL = await db.get(
      "SELECT id FROM Matiere WHERE nom = ?",
      ["Génie Logiciel"]
    );
    const matiereBDD = await db.get(
      "SELECT id FROM Matiere WHERE nom = ?",
      ["Bases de Données"]
    );
    const matiereReseaux = await db.get(
      "SELECT id FROM Matiere WHERE nom = ?",
      ["Réseaux"]
    );

    const seanceCount = await db.get("SELECT COUNT(*) AS total FROM Seance");
    if (seanceCount.total === 0 && ensUser && cohorteMiage && cohorteM1) {
      await db.run(
        `
        INSERT INTO Seance
          (dateSeance, heureDebut, duree, typeSeance, statut, description, matiere_id, cohorte_id, enseignant_id)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "2026-03-30", "09:00", 120, "CM", "PLANIFIE", "Cours magistral de génie logiciel", matiereGL.id, cohorteMiage.id, ensUser.id,
          "2026-03-31", "10:00", 120, "TD", "PLANIFIE", "TD bases de données", matiereBDD.id, cohorteMiage.id, ensUser.id,
          "2026-04-01", "14:00", 180, "TP", "PLANIFIE", "TP réseaux", matiereReseaux.id, cohorteM1.id, ensUser.id
        ]
      );
    }

    const seance1 = await db.get(
      "SELECT id, cohorte_id, enseignant_id FROM Seance WHERE dateSeance = ? AND heureDebut = ?",
      ["2026-03-30", "09:00"]
    );

    const salleA101 = await db.get(
      "SELECT id FROM Salle WHERE code = ?",
      ["A101"]
    );

    const reservationCount = await db.get("SELECT COUNT(*) AS total FROM Reservation");
    if (reservationCount.total === 0 && adminUser && seance1 && salleA101) {
      await db.run(
        `
        INSERT INTO Reservation (
          type_demande,
          seance_id,
          source_reservation_id,
          salle_id,
          demandeur_id,
          cohorte_id,
          enseignant_id,
          priorite,
          statut,
          motif
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "MODIFICATION",
          seance1.id,
          null,
          salleA101.id,
          adminUser.id,
          seance1.cohorte_id,
          seance1.enseignant_id,
          80,
          "VALIDEE",
          "Réservation validée pour CM"
        ]
      );
    }

    const notifCount = await db.get("SELECT COUNT(*) AS total FROM Notification");
    if (notifCount.total === 0) {
      await db.run(`
        INSERT INTO Notification (role, status, titre, message, date, iconType) VALUES
        ('enseignant', 'nouveau', 'Demande de réservation', 'Une nouvelle réservation est en attente de traitement.', '2026-03-27 08:45', 'info'),
        ('enseignant', 'important', 'Conflit détecté', 'Un conflit a été détecté dans votre planning.', '2026-03-27 09:10', 'warning'),
        ('etudiant', 'nouveau', 'Changement de salle', 'Votre cours a été déplacé en A101.', '2026-03-27 09:15', 'location')
      `);
    }

    console.log("Base de données initialisée avec succès.");
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base :", error);
    process.exitCode = 1;
  } finally {
    if (db) {
      await db.close();
    }
  }
}

init();