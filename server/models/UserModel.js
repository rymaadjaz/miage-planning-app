const { getDbConnection } = require('../db/database');

const UserModel = {
  // Trouver un utilisateur par email pour le login
  findByEmail: async (email) => {
    const db = await getDbConnection();
    return await db.get('SELECT * FROM Utilisateur WHERE email = ?', [email]);
  }
};

module.exports = UserModel;