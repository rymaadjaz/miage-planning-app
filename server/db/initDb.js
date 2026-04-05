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
        status TEXT NOT NULL DEFAULT 'nouveau' CHECK(status IN ('nouveau', 'lu')),
        titre TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        iconType TEXT NOT NULL DEFAULT 'info' CHECK(iconType IN ('info', 'location', 'check', 'warning')),
        cohorte_id INTEGER REFERENCES Cohorte(id) ON DELETE SET NULL
      );
    `);

    // ==========================================
    // 2. TRIGGERS ET INDEXES
    // ==========================================
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

    
    const count = await db.get("SELECT COUNT(*) as total FROM Utilisateur");
    if (count.total === 0) {
      console.log("🚀 Lancement du méga-remplissage de la base de données...");

      const defaultPassword = await bcrypt.hash("changeme", 10);

      await db.exec(`
        INSERT INTO Cohorte (nom, effectif, niveau) VALUES
        ('L3 MIAGE', 45, 'Licence 3'),
        ('M1 MIAGE', 35, 'Master 1'),
        ('M2 MIAGE', 30, 'Master 2');
      `);

      // ⚠️ Insertion des utilisateurs avec le mot de passe sécurisé
      await db.run(`
        INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, role) VALUES
        ('Admin', 'Principal', 'admin.planning@univ.fr', ?, 'administratif'),
        ('Admin', 'Scolarite', 'scolarite@univ.fr', ?, 'administratif'),
        ('Beduneau', 'Jean', 'prof.beduneau@univ.fr', ?, 'enseignant'),
        ('Dubois', 'Marie', 'prof.dubois@univ.fr', ?, 'enseignant'),
        ('Martin', 'Paul', 'prof.martin@univ.fr', ?, 'enseignant'),
        ('Leroy', 'Sophie', 'prof.leroy@univ.fr', ?, 'enseignant'),
        ('Moreau', 'Luc', 'prof.moreau@univ.fr', ?, 'enseignant'),
        ('Youssef', 'Edris', 'edris.youssef@univ.fr', ?, 'etudiant'),
        ('El Hathout', 'Lina', 'lina.elhathout@univ.fr', ?, 'etudiant'),
        ('Belkacemi', 'Cirine', 'cirine.belkacemi@univ.fr', ?, 'etudiant'),
        ('Adjaz', 'Ryma', 'ryma.adjaz@univ.fr', ?, 'etudiant'),
        ('Dupont', 'Alice', 'alice.dupont@univ.fr', ?, 'etudiant'),
        ('Durand', 'Lucas', 'lucas.durand@univ.fr', ?, 'etudiant'),
        ('Bernard', 'Emma', 'emma.bernard@univ.fr', ?, 'etudiant'),
        ('Thomas', 'Hugo', 'hugo.thomas@univ.fr', ?, 'etudiant'),
        ('Petit', 'Chloé', 'chloe.petit@univ.fr', ?, 'etudiant'),
        ('Robert', 'Louis', 'louis.robert@univ.fr', ?, 'etudiant')
      `, [
        defaultPassword, defaultPassword, defaultPassword, defaultPassword, defaultPassword, 
        defaultPassword, defaultPassword, defaultPassword, defaultPassword, defaultPassword, 
        defaultPassword, defaultPassword, defaultPassword, defaultPassword, defaultPassword, 
        defaultPassword, defaultPassword
      ]);

      await db.exec(`
        INSERT INTO Enseignant (id, grade, service) VALUES
        (3, 'Maitre de Conferences', 'Informatique'),
        (4, 'Professeur des Universites', 'Mathematiques'),
        (5, 'PRAG', 'Gestion'),
        (6, 'Maitre de Conferences', 'Bases de donnees'),
        (7, 'Vacataire', 'Droit');

        INSERT INTO Etudiant (id, numeroEtudiant, annee, filiere, cohorte_id) VALUES
        (8, '20260001', 2026, 'MIAGE', 2),
        (9, '20260002', 2026, 'MIAGE', 2),
        (10, '20260003', 2026, 'MIAGE', 2),
        (11, '20260004', 2026, 'MIAGE', 2),
        (12, '20260005', 2026, 'MIAGE', 1),
        (13, '20260006', 2026, 'MIAGE', 1),
        (14, '20260007', 2026, 'MIAGE', 1),
        (15, '20260008', 2026, 'MIAGE', 3),
        (16, '20260009', 2026, 'MIAGE', 3),
        (17, '20260010', 2026, 'MIAGE', 3);

        INSERT INTO Matiere (nom, volumeHoraireTotal) VALUES
        ('Developpement Web (React/Node)', 40),
        ('Conception de Bases de Donnees', 30),
        ('Algorithmique Avancee', 35),
        ('Gestion de Projet Agile', 20),
        ('Architecture des Reseaux', 25),
        ('Droit de l''Informatique', 15),
        ('Intelligence Artificielle', 30);

        INSERT INTO Salle (code, capacite, type, accessibilitePMR) VALUES
        ('AMPHI-A', 250, 'AMPHI', 1),
        ('AMPHI-B', 150, 'AMPHI', 1),
        ('TD-101', 40, 'TD', 1),
        ('TD-102', 40, 'TD', 0),
        ('TD-103', 40, 'TD', 0),
        ('TP-201', 25, 'TP', 1),
        ('TP-202', 25, 'TP', 0),
        ('LABO-MAC', 20, 'LABO', 1),
        ('INFO-1', 30, 'INFO', 1),
        ('INFO-2', 30, 'INFO', 0);

        INSERT INTO Equipement (nom, salle_id) VALUES
        ('Videoprojecteur 4K', 1),
        ('Microphone sans fil', 1),
        ('Tableau Blanc Interactif', 3),
        ('20 iMac M3', 8),
        ('30 PC Dell', 9);

        INSERT INTO Seance (dateSeance, heureDebut, duree, typeSeance, matiere_id, cohorte_id, enseignant_id) VALUES
        ('2026-03-30', '08:00', 120, 'CM', 1, 2, 3), 
        ('2026-03-30', '10:30', 180, 'TP', 1, 2, 3), 
        ('2026-03-30', '14:00', 120, 'CM', 2, 1, 6),
        ('2026-03-31', '09:00', 180, 'TD', 4, 2, 5), 
        ('2026-03-31', '13:30', 120, 'CM', 5, 3, 4),
        ('2026-04-01', '08:30', 120, 'TD', 3, 1, 4), 
        ('2026-04-01', '09:00', 120, 'CM', 6, 2, 7), 
        ('2026-04-01', '08:30', 120, 'TD', 2, 2, 4), 
        ('2026-04-02', '10:00', 240, 'TP', 7, 3, 6),
        ('2026-04-03', '14:00', 180, 'EXAMEN', 1, 2, 3); 

        INSERT INTO Reservation (seance_id, salle_id, demandeur_id, statut) VALUES
        (1, 1, 1, 'VALIDEE'), 
        (2, 9, 1, 'VALIDEE'), 
        (3, 2, 1, 'VALIDEE'), 
        (4, 3, 1, 'VALIDEE'), 
        (5, 1, 1, 'VALIDEE'), 
        (6, 4, 1, 'VALIDEE'), 
        (7, 4, 1, 'PLANIFIEE'), 
        (8, 5, 1, 'VALIDEE'), 
        (9, 8, 1, 'VALIDEE'), 
        (10, 1, 1, 'VALIDEE'); 
        
        INSERT INTO Notification (role, status, titre, message, date, iconType) VALUES
        ('enseignant', 'nouveau', 'Demande de réservation', 'Une nouvelle réservation est en attente de traitement.', '2026-03-27 08:45', 'info'),
        ('enseignant', 'nouveau', 'Conflit détecté', 'Un conflit a été détecté dans votre planning.', '2026-03-27 09:10', 'warning'),
        ('etudiant', 'nouveau', 'Changement de salle', 'Votre cours a été déplacé en A101.', '2026-03-27 09:15', 'location');
      `);

      console.log("✅ Données massives ajoutées avec succès !");
      console.log("🚨 Les mots de passe sont tous définis sur 'changeme'");
    }
    else {
      console.log("La base contient déjà des données, aucune insertion nécessaire.");
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