const { getDbConnection } = require('./database');
const bcrypt = require('bcryptjs');

async function hashAllPasswords() {
  try {
    const db = await getDbConnection();
    const users = await db.all('SELECT id, mot_de_passe FROM Utilisateur');

    console.log(`Hachage de ${users.length} mots de passe...`);

    for (const user of users) {
      // On génère le "sel" et le "hash"
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.mot_de_passe, salt);

      // Mise à jour dans la base
      await db.run('UPDATE Utilisateur SET mot_de_passe = ? WHERE id = ?', [
        hashedPassword,
        user.id
      ]);
    }

    console.log("Tous les mots de passe ont été sécurisés !");
  } catch (error) {
    console.error("Erreur :", error);
  }
}

hashAllPasswords();