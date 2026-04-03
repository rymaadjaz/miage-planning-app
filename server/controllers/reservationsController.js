const ApiError = require("../utils/ApiError");
const reservationModel = require("../models/reservation.model");
const reservationService = require("../services/reservation.service");

function toUpper(value = "") {
  return String(value || "").trim().toUpperCase();
}

function toHHMM(value) {
  if (!value) return "00:00";
  const txt = String(value);
  if (txt.includes(":")) return txt.slice(0, 5);
  return `${txt.padStart(2, "0")}:00`;
}

function addMinutes(hhmm, minutes) {
  const [h, m] = toHHMM(hhmm).split(":").map(Number);
  const start = h * 60 + m;
  const end = start + (Number(minutes) || 0);
  const eh = Math.floor(end / 60) % 24;
  const em = end % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

function computeDuration(start, end) {
  const [sh, sm] = String(start).split(":").map(Number);
  const [eh, em] = String(end).split(":").map(Number);

  if (
    Number.isNaN(sh) || Number.isNaN(sm) ||
    Number.isNaN(eh) || Number.isNaN(em)
  ) {
    throw new ApiError(400, "Heure de début ou de fin invalide");
  }

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const duration = endMinutes - startMinutes;

  if (duration <= 0) {
    throw new ApiError(400, "L'heure de fin doit être après l'heure de début");
  }

  return duration;
}

function formatFrontStatus(statut) {
  switch (statut) {
    case "VALIDEE":
      return "VALIDÉE";
    case "ANNULEE":
      return "REFUSÉE";
    case "EN_ATTENTE":
      return "EN ATTENTE";
    case "PLANIFIEE":
      return "AJUSTÉE";
    default:
      return statut;
  }
}

function formatFrontType(type) {
  return type === "EXAMEN" ? "EXAM" : type;
}

function formatFrontDemandeType(typeDemande) {
  return typeDemande === "MODIFICATION" ? "DEPLACEMENT" : "CREATION";
}

function ensureReservationAccess(row, user) {
  if (!user) {
    throw new ApiError(401, "Utilisateur non authentifié");
  }

  if (String(user.role).toLowerCase() === "administratif") {
    return;
  }

  if (String(user.role).toLowerCase() === "enseignant") {
    const currentUserId = Number(user.id);
    const isOwner =
      Number(row.demandeur_id) === currentUserId ||
      Number(row.enseignant_id) === currentUserId;

    if (!isOwner) {
      throw new ApiError(403, "Accès interdit");
    }

    return;
  }

  throw new ApiError(403, "Accès interdit");
}

async function buildCreatePayload(body, currentUser) {
  const hasNativeBackendShape =
    body.type_demande !== undefined ||
    body.date_souhaitee !== undefined ||
    body.heure_debut_souhaitee !== undefined ||
    body.duree_souhaitee !== undefined ||
    body.type_seance_souhaitee !== undefined;

  if (hasNativeBackendShape) {
    return {
      type_demande: toUpper(body.type_demande || "AJOUT"),
      salle_id: body.salle_id ? Number(body.salle_id) : null,
      seance_id: body.seance_id ? Number(body.seance_id) : null,
      created_by: currentUser?.id || null,
      motif: body.motif || null,
      date_souhaitee: body.date_souhaitee || null,
      heure_debut_souhaitee: body.heure_debut_souhaitee || null,
      duree_souhaitee:
        body.duree_souhaitee !== undefined && body.duree_souhaitee !== null
          ? Number(body.duree_souhaitee)
          : null,
      type_seance_souhaitee: body.type_seance_souhaitee
        ? toUpper(body.type_seance_souhaitee)
        : null,
      cohorte_id: body.cohorte_id ? Number(body.cohorte_id) : null,
      enseignant_id: body.enseignant_id
        ? Number(body.enseignant_id)
        : currentUser?.role === "enseignant"
        ? Number(currentUser.id)
        : null,
    };
  }

  const demandeTypeFront = toUpper(body.demande_type || body.demandeType || "CREATION");
  const isMove =
    demandeTypeFront === "DEPLACEMENT" || demandeTypeFront === "MODIFICATION";

  let sourceReservation = null;
  let seanceId = body.seance_id ? Number(body.seance_id) : null;

  if (!seanceId && body.source_reservation_id) {
    sourceReservation = await reservationModel.findById(
      Number(body.source_reservation_id)
    );

    if (!sourceReservation) {
      throw new ApiError(404, "Réservation source introuvable");
    }

    seanceId = sourceReservation.seance_id
      ? Number(sourceReservation.seance_id)
      : null;
  }

  if (isMove && !seanceId) {
    throw new ApiError(
      400,
      "Une demande de déplacement doit référencer une séance existante"
    );
  }

  const enseignantId = body.enseignant_id
    ? Number(body.enseignant_id)
    : currentUser?.role === "enseignant"
    ? Number(currentUser.id)
    : sourceReservation?.enseignant_id
    ? Number(sourceReservation.enseignant_id)
    : null;

  const cohorteId = body.cohorte_id
    ? Number(body.cohorte_id)
    : sourceReservation?.cohorte_id
    ? Number(sourceReservation.cohorte_id)
    : null;

  return {
    type_demande: isMove ? "MODIFICATION" : "AJOUT",
    salle_id: body.salle_id
      ? Number(body.salle_id)
      : sourceReservation?.salle_id
      ? Number(sourceReservation.salle_id)
      : null,
    seance_id: isMove ? seanceId : null,
    created_by: currentUser?.id || null,
    motif: body.motif || null,
    date_souhaitee: isMove ? null : body.date || null,
    heure_debut_souhaitee: isMove ? null : body.debut || null,
    duree_souhaitee:
      isMove || !body.debut || !body.fin
        ? null
        : computeDuration(body.debut, body.fin),
    type_seance_souhaitee: isMove
      ? null
      : body.type
      ? toUpper(body.type)
      : null,
    cohorte_id: cohorteId,
    enseignant_id: enseignantId,
  };
}

exports.getAll = async (req, res) => {
  const rows = await reservationModel.findAll();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id réservation invalide");
  }

  const row = await reservationModel.findById(id);
  if (!row) {
    throw new ApiError(404, "Réservation introuvable");
  }

  ensureReservationAccess(row, req.user);

  res.json(row);
};

exports.getFrontDemandes = async (req, res) => {
  const rows = await reservationModel.findFrontDemandes();

  const filtered =
    String(req.user?.role || "").toLowerCase() === "administratif"
      ? rows
      : rows.filter((r) => Number(r.enseignant_id) === Number(req.user.id));

  const formatted = filtered.map((r) => {
    const heureDebut = r.heureDebut || r.heure_debut_souhaitee || "00:00";
    const duree = Number(r.duree || r.duree_souhaitee || 0);

    return {
      id: r.id,
      seanceId: r.seance_id || null,
      salleId: r.salle_id || null,
      cohorteId: r.cohorte_id || null,
      enseignantId: r.enseignant_id || null,
      statut: formatFrontStatus(r.statut),
      demandeType: formatFrontDemandeType(r.type_demande),
      type: formatFrontType(r.typeSeance || r.type_seance_souhaitee),
      date: r.dateSeance || r.date_souhaitee || "",
      debut: toHHMM(heureDebut),
      fin: addMinutes(heureDebut, duree),
      duree,
      salle: r.salle_code || "-",
      cohorte: r.cohorte_nom || "-",
      enseignant: r.enseignant_nom
        ? `${r.enseignant_prenom} ${r.enseignant_nom}`
        : "",
      motif: r.motif || "",
      createdAt: r.created_at || new Date().toISOString(),
    };
  });

  res.json(formatted);
};

exports.create = async (req, res) => {
  const payload = await buildCreatePayload(req.body, req.user);
  const result = await reservationService.createReservation(payload);

  res.status(201).json(result);
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id réservation invalide");
  }

  const existing = await reservationModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Réservation introuvable");
  }

  ensureReservationAccess(existing, req.user);

  const result = await reservationService.updateReservation(
    id,
    req.body,
    req.user?.id || null
  );

  res.json(result);
};

exports.cancel = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id réservation invalide");
  }

  const existing = await reservationModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Réservation introuvable");
  }

  ensureReservationAccess(existing, req.user);

  const result = await reservationService.cancelReservation(
    id,
    req.user?.id || null
  );

  res.json(result);
};