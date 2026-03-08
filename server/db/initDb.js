const { getDbConnection } = require('./database.js');

async function init() {
  try {
    const db = await getDbConnection();

    // Active les clés étrangères (désactivées par défaut sur SQLite)
    await db.exec(`PRAGMA foreign_keys = ON;`);

    // ============================================================
    // 1. UTILISATEUR
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Utilisateur (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        nom         TEXT    NOT NULL,
        prenom      TEXT    NOT NULL,
        email       TEXT    NOT NULL UNIQUE,
        mot_de_passe TEXT   NOT NULL DEFAULT 'changeme',  -- hash bcrypt (Edris)
        role        TEXT    NOT NULL CHECK(role IN ('etudiant', 'enseignant', 'administratif')),
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ============================================================
    // 2. COHORTE
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Cohorte (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        nom       TEXT    NOT NULL,
        effectif  INTEGER NOT NULL DEFAULT 0,
        niveau    TEXT                         
      );
    `);

    // ============================================================
    // 3. MATIERE
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Matiere (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        nom                 TEXT    NOT NULL,
        volumeHoraireTotal  INTEGER             
      );
    `);

    // ============================================================
    // 4. SALLE
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Salle (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        code            TEXT    NOT NULL UNIQUE,  -- ex: 'B203', 'Amphi A'
        capacite        INTEGER NOT NULL,
        type            TEXT    NOT NULL CHECK(type IN ('AMPHI', 'TD', 'TP', 'LABO', 'INFO')),
        accessibilitePMR INTEGER NOT NULL DEFAULT 0 
      );
    `);

    // ============================================================
    // 5. EQUIPEMENT (lié à une salle)
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Equipement (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        nom      TEXT    NOT NULL,
        salle_id INTEGER REFERENCES Salle(id) ON DELETE CASCADE
      );
    `);

    // ============================================================
    // 6. ETUDIANT (extension de Utilisateur)
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Etudiant (
        id              INTEGER PRIMARY KEY REFERENCES Utilisateur(id) ON DELETE CASCADE,
        numeroEtudiant  TEXT    NOT NULL UNIQUE,
        annee           INTEGER,
        filiere         TEXT,
        cohorte_id      INTEGER REFERENCES Cohorte(id) ON DELETE SET NULL
      );
    `);

    // ============================================================
    // 7. ENSEIGNANT (extension de Utilisateur)
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Enseignant (
        id      INTEGER PRIMARY KEY REFERENCES Utilisateur(id) ON DELETE CASCADE,
        grade   TEXT,       
        service TEXT      
      );
    `);

    // ============================================================
    // 8. DISPONIBILITE (créneaux dispo/indispo d'un enseignant)
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Disponibilite (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        enseignant_id INTEGER NOT NULL REFERENCES Enseignant(id) ON DELETE CASCADE,
        jour          TEXT    NOT NULL CHECK(jour IN ('Lundi','Mardi','Mercredi','Jeudi','Vendredi')),
        heureDebut    TEXT    NOT NULL,  -- format 'HH:MM'
        heureFin      TEXT    NOT NULL,
        disponible    INTEGER NOT NULL DEFAULT 1 
      );
    `);

    // ============================================================
    // 9. SEANCE (cours planifié — table centrale de l'EDT)
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Seance (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        dateSeance    DATE    NOT NULL,
        heureDebut    TEXT    NOT NULL,   -- format 'HH:MM'
        duree         INTEGER NOT NULL,   -- en minutes
        typeSeance    TEXT    NOT NULL CHECK(typeSeance IN ('CM','TD','TP','EXAMEN','EVENEMENT','REUNION')),
        statut        TEXT    NOT NULL DEFAULT 'PLANIFIE'
                      CHECK(statut IN ('PLANIFIE','VALIDE','ANNULE')),
        matiere_id    INTEGER REFERENCES Matiere(id),
        cohorte_id    INTEGER REFERENCES Cohorte(id),
        enseignant_id INTEGER REFERENCES Utilisateur(id),
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ============================================================
    // 10. RESERVATION (lien Séance <-> Salle + gestion des demandes)
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Reservation (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        seance_id    INTEGER REFERENCES Seance(id) ON DELETE CASCADE,
        salle_id     INTEGER REFERENCES Salle(id),
        demandeur_id INTEGER REFERENCES Utilisateur(id),
        priorite     INTEGER NOT NULL DEFAULT 2,  -- 1=exam, 2=cours, 3=evenement
        statut       TEXT    NOT NULL DEFAULT 'EN_ATTENTE'
                     CHECK(statut IN ('PLANIFIEE','VALIDEE','ANNULEE','EN_ATTENTE')),
        motif        TEXT,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ============================================================
    // 11. CONFLIT (détecté par l'algorithme — Edris)
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Conflit (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        type            TEXT    NOT NULL,   -- 'DOUBLE_RESERVATION', 'CAPACITE', 'INDISPO_ENSEIGNANT'
        description     TEXT    NOT NULL,
        resolu          INTEGER NOT NULL DEFAULT 0,
        reservation_id  INTEGER REFERENCES Reservation(id) ON DELETE SET NULL,
        seance_id_1     INTEGER REFERENCES Seance(id) ON DELETE CASCADE,
        seance_id_2     INTEGER REFERENCES Seance(id) ON DELETE CASCADE,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ============================================================
    // 12. HISTORIQUE (journal des modifications — règle de gestion)
    // ============================================================
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Historique (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        auteur_id   INTEGER REFERENCES Utilisateur(id) ON DELETE SET NULL,
        entite      TEXT    NOT NULL,   
        entite_id   INTEGER NOT NULL,
        action      TEXT    NOT NULL,   
        detail      TEXT,               
        date_action DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);


    // ============================================================
    // 14. INDEX (optimisation des requêtes de l'algorithme)
    // ============================================================
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_seance_date       ON Seance(dateSeance);
      CREATE INDEX IF NOT EXISTS idx_seance_salle      ON Reservation(salle_id, seance_id);
      CREATE INDEX IF NOT EXISTS idx_seance_enseignant ON Seance(enseignant_id, dateSeance);
      CREATE INDEX IF NOT EXISTS idx_seance_cohorte    ON Seance(cohorte_id, dateSeance);
      CREATE INDEX IF NOT EXISTS idx_conflit_resolu    ON Conflit(resolu);
    `);

    // ============================================================
    // DONNÉES DE TEST (insérées une seule fois si table vide)
    // ============================================================
    const count = await db.get('SELECT COUNT(*) as total FROM Utilisateur');

    if (count.total === 0) {
      console.log('Insertion des données de test...');

      await db.run(`
        INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, role) VALUES
        ('Youssef', 'Edris', 'edris.youssef@univ.fr', 'changeme', 'etudiant'),
        ('Beduneau', 'Jean', 'prof.beduneau@univ.fr', 'changeme', 'enseignant'),
        ('AdminNom', 'AdminPrenom', 'admin.planning@univ.fr', 'changeme', 'administratif')
      `);
      console.log('Données de test ajoutées avec succès !');
    } else {
      console.log('La base contient déjà des données, aucune insertion nécessaire.');
    }

    console.log('Base de données initialisée avec succès.');

  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base :", error);
    process.exit(1);
  }
}

init();