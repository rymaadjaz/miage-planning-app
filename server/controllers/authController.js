const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Importé mais pas encore utilisé

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Tentative de login pour :", email);

  try {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      console.log("Utilisateur non trouvé en base");
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const isMatch = await bcrypt.compare(password, user.mot_de_passe);
    console.log("Résultat comparaison bcrypt :", isMatch);

    if (!isMatch) {
      console.log("Mot de passe incorrect");
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    
    // Après :
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      message: "Connexion réussie",
      token: token, 
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Erreur serveur :", error); 
    res.status(500).json({ error: error.message });
  }
};