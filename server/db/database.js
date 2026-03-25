const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
require("dotenv").config();

async function getDbConnection() {
  return open({
    filename: path.join(__dirname, process.env.DB_NAME || "planning.db"),
    driver: sqlite3.Database,
  });
}

module.exports = { getDbConnection };