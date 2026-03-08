const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config(); // Pour lire le fichier .env

async function getDbConnection() {
  return open({
    // On utilise path.join pour que le chemin soit correct peu importe d'où on lance le script
    filename: path.join(__dirname, process.env.DB_NAME || 'planning.db'), 
    driver: sqlite3.Database
  });
}

module.exports = { getDbConnection };