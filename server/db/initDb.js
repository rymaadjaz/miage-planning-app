const { getDbConnection } = require('./database.js');

async function init() {
  try {
    const db = await getDbConnection();

    await db.exec(`PRAGMA foreign_keys = ON;`);

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

   
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Cohorte (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        nom       TEXT    NOT NULL,
        effectif  INTEGER NOT NULL DEFAULT 0,
        niveau    TEXT                         
      );
    `);

  
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Matiere (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        nom                 TEXT    NOT NULL,
        volumeHoraireTotal  INTEGER             
      );
    `);

  
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Salle (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        code            TEXT    NOT NULL UNIQUE,  -- ex: 'B203', 'Amphi A'
        capacite        INTEGER NOT NULL,
        type            TEXT    NOT NULL CHECK(type IN ('AMPHI', 'TD', 'TP', 'LABO', 'INFO')),
        accessibilitePMR INTEGER NOT NULL DEFAULT 0 
      );
    `);

    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Equipement (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        nom      TEXT    NOT NULL,
        salle_id INTEGER REFERENCES Salle(id) ON DELETE CASCADE
      );
    `);

    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Etudiant (
        id              INTEGER PRIMARY KEY REFERENCES Utilisateur(id) ON DELETE CASCADE,
        numeroEtudiant  TEXT    NOT NULL UNIQUE,
        annee           INTEGER,
        filiere         TEXT,
        cohorte_id      INTEGER REFERENCES Cohorte(id) ON DELETE SET NULL
      );
    `);

    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Enseignant (
        id      INTEGER PRIMARY KEY REFERENCES Utilisateur(id) ON DELETE CASCADE,
        grade   TEXT,       
        service TEXT      
      );
    `);

    
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


    
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_seance_date       ON Seance(dateSeance);
      CREATE INDEX IF NOT EXISTS idx_seance_salle      ON Reservation(salle_id, seance_id);
      CREATE INDEX IF NOT EXISTS idx_seance_enseignant ON Seance(enseignant_id, dateSeance);
      CREATE INDEX IF NOT EXISTS idx_seance_cohorte    ON Seance(cohorte_id, dateSeance);
      CREATE INDEX IF NOT EXISTS idx_conflit_resolu    ON Conflit(resolu);
    `);

   
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