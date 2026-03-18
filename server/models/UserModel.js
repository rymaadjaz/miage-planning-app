const { getDbConnection } = require('../db/database');

const UserModel = {
  findByEmail: async (email) => {
    const db = await getDbConnection();
    return await db.get('SELECT * FROM Utilisateur WHERE email = ?', [email]);
  }
};

module.exports = UserModel;