const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
require("dotenv").config();

async function getDbConnection() {
  const db = await open({
    filename: path.join(__dirname, process.env.DB_NAME || "planning.db"),
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

module.exports = { getDbConnection };