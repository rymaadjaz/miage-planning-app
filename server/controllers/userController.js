const { getDbConnection } = require('../db/database');

exports.getUsers = async (req, res) => {
  try {
    const db = await getDbConnection();
    const users = await db.all('SELECT * FROM Utilisateur');
    console.log("Voici les données de USERS :", users);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};