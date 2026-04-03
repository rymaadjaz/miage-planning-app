const historiqueModel = require("../models/historique.model");

exports.logAction = async ({ auteur_id = null, entite, entite_id, action, detail = null }) => {
  return historiqueModel.create({
    auteur_id,
    entite,
    entite_id,
    action,
    detail,
  });
};