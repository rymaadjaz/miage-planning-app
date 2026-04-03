const { getDbConnection } = require("./database");
const bcrypt = require("bcryptjs");

function isBcryptHash(value) {
  const txt = String(value || "");
  return txt.startsWith("$2a$") || txt.startsWith("$2b$") || txt.startsWith("$2y$");
}

async function hashAllPasswords() {
  let db;

  try {
    db = await getDbConnection();
    const users = await db.all("SELECT id, mot_de_passe FROM Utilisateur");

    console.log(`Vérification de ${users.length} mots de passe...`);

    let updatedCount = 0;

    for (const user of users) {
      const currentPassword = String(user.mot_de_passe || "");

      if (isBcryptHash(currentPassword)) {
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(currentPassword, salt);

      await db.run(
        "UPDATE Utilisateur SET mot_de_passe = ? WHERE id = ?",
        [hashedPassword, user.id]
      );

      updatedCount++;
    }

    console.log(`${updatedCount} mot(s) de passe ont été sécurisés.`);
  } catch (error) {
    console.error("Erreur :", error);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

hashAllPasswords();