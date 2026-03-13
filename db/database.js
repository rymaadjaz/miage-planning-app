const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "gestion_edt.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("BASE DE DONNEES Error:", err.message);
  else console.log("SQLite connected:", dbPath);
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON;");

  // SALLES
  db.run(`
    CREATE TABLE IF NOT EXISTS salles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL UNIQUE,
      capacite INTEGER NOT NULL CHECK(capacite > 0),
      type TEXT NOT NULL CHECK(type IN ('AMPHI','TD','TP','LABO','INFO')),
      accessiblePMR INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1
    );
  `);

  // COHORTES
  db.run(`
    CREATE TABLE IF NOT EXISTS cohortes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      annee INTEGER NOT NULL CHECK(annee > 0),
      filiere TEXT,
      specialite TEXT,
      effectif INTEGER NOT NULL CHECK(effectif > 0),
      parent_id INTEGER,
      isActive INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(parent_id) REFERENCES cohortes(id)
    );
  `);

  // SEANCES
  db.run(`
    CREATE TABLE IF NOT EXISTS seances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('CM','TD','TP','EXAMEN','EVENEMENT','REUNION')),
      duree_minutes INTEGER NOT NULL DEFAULT 90 CHECK(duree_minutes >= 15),
      enseignant_id INTEGER NOT NULL,
      cohorte_id INTEGER NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(cohorte_id) REFERENCES cohortes(id)
    );
  `);

  // MAINTENANCE
  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_salles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      salle_id INTEGER NOT NULL,
      date_debut TEXT NOT NULL,
      date_fin TEXT NOT NULL,
      description TEXT,
      statut TEXT NOT NULL DEFAULT 'PLANNED' CHECK(statut IN ('PLANNED','DONE','CANCELLED')),
      FOREIGN KEY(salle_id) REFERENCES salles(id)
    );
  `);

  // RESERVATIONS
  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      salle_id INTEGER NOT NULL,
      seance_id INTEGER NOT NULL,
      heure_debut TEXT NOT NULL,
      heure_fin TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'PLANIFIEE' CHECK(statut IN ('PLANIFIEE','VALIDEE','ANNULEE')),
      priorite INTEGER NOT NULL DEFAULT 10,
      version INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(salle_id) REFERENCES salles(id),
      FOREIGN KEY(seance_id) REFERENCES seances(id)
    );
  `);

  // Trigger updated_at sert à mettre à jour automatiquement la date de modification d’une ligne dans une base de données
  db.run(`
    CREATE TRIGGER IF NOT EXISTS trg_reservations_updated
    AFTER UPDATE ON reservations
    FOR EACH ROW
    BEGIN
      UPDATE reservations SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  // INDEX sert à accélérer les recherches dans une table
  db.run(`CREATE INDEX IF NOT EXISTS idx_res_salle_time ON reservations(salle_id, heure_debut, heure_fin);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_res_seance_time ON reservations(seance_id, heure_debut, heure_fin);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_maint_salle_time ON maintenance_salles(salle_id, date_debut, date_fin);`);
});

module.exports = db;