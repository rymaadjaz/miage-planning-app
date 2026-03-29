const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

const DEFAULT_ENSEIGNANT_ID = Number(process.env.REACT_APP_ENSEIGNANT_ID || 2);
const DEFAULT_COHORTE_ID = Number(process.env.REACT_APP_COHORTE_ID || 1);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toUpper(value = "") {
  return String(value || "").trim().toUpperCase();
}

function toLower(value = "") {
  return String(value || "").trim().toLowerCase();
}

function toHHMM(value) {
  if (!value) return "00:00";

  const txt = String(value).trim();

  if (txt.includes(":")) {
    return txt.slice(0, 5);
  }

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

function computeDurationMinutes(debut, fin) {
  if (!debut || !fin) return null;

  const [dh, dm] = toHHMM(debut).split(":").map(Number);
  const [fh, fm] = toHHMM(fin).split(":").map(Number);

  const start = dh * 60 + dm;
  const end = fh * 60 + fm;
  const duration = end - start;

  return duration > 0 ? duration : null;
}

function normalizeType(type = "") {
  const t = toUpper(type);
  if (t === "EXAMEN") return "EXAM";
  if (t === "EXAM") return "EXAM";
  return t;
}

function normalizeBackendType(type = "") {
  const t = toUpper(type);
  if (t === "EXAM") return "EXAMEN";
  return t;
}

function normalizeFrontStatut(statut = "") {
  const s = toUpper(statut);

  switch (s) {
    case "VALIDEE":
    case "VALIDÉE":
      return "VALIDÉE";
    case "ANNULEE":
    case "ANNULÉE":
    case "REFUSEE":
    case "REFUSÉE":
      return "REFUSÉE";
    case "EN_ATTENTE":
      return "EN ATTENTE";
    case "PLANIFIEE":
    case "PLANIFIÉE":
      return "AJUSTÉE";
    default:
      return statut || "";
  }
}

function normalizeFrontDemandeType(type = "") {
  const t = toUpper(type);

  if (t === "MODIFICATION" || t === "DEPLACEMENT") return "DEPLACEMENT";
  return "CREATION";
}

function normalizeBackendDemandeType(type = "") {
  const t = toUpper(type);

  if (t === "DEPLACEMENT" || t === "MODIFICATION") return "MODIFICATION";
  return "AJOUT";
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function request(
  path,
  { method = "GET", data, headers = {}, auth = false } = {}
) {
  const token = getToken();

  const finalHeaders = {
    ...headers,
  };

  if (data !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    if (!token) {
      throw new Error("Non authentifié");
    }
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.message || payload?.error || `Erreur API (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export async function login(email, password) {
  const payload = await request("/api/auth/login", {
    method: "POST",
    data: { email, password },
  });

  if (payload?.token) {
    setToken(payload.token);
  }

  if (payload?.user) {
    setUser(payload.user);
  }

  return payload;
}

export async function logout() {
  clearToken();
  return true;
}

function mapPlanningRow(row = {}) {
  const debut = row.debut || row.heureDebut || "00:00";
  const duree = Number(row.duree || 0);

  return {
    id: String(row.id ?? ""),
    matiere: row.matiere || row.matiere_nom || "Cours",
    titre: row.titre || row.description || row.matiere || row.matiere_nom || "Séance",
    salle: row.salle || row.salle_code || "-",
    date: row.date || row.dateSeance || "",
    debut: toHHMM(debut),
    fin: row.fin ? toHHMM(row.fin) : addMinutes(debut, duree),
    type: normalizeType(row.type || row.typeSeance),
    enseignant: row.enseignant || row.enseignant_nom || "",
    cohorte: row.cohorte || row.cohorte_nom || "",
    description: row.description || "",
    statut: row.statut || "",
    duree,
  };
}

function mapReservationFrontRow(row = {}) {
  const heureDebut =
    row.debut ||
    row.heureDebut ||
    row.heure_debut_souhaitee ||
    "00:00";

  const duree =
    Number(row.duree) ||
    Number(row.duree_souhaitee) ||
    0;

  return {
    id: String(row.id ?? ""),
    seanceId: row.seanceId ?? row.seance_id ?? null,
    salleId: row.salleId ?? row.salle_id ?? null,
    cohorteId: row.cohorteId ?? row.cohorte_id ?? null,
    enseignantId: row.enseignantId ?? row.enseignant_id ?? null,
    statut: normalizeFrontStatut(row.statut || ""),
    demandeType: normalizeFrontDemandeType(row.demandeType || row.type_demande),
    type: normalizeType(
      row.type || row.typeSeance || row.type_seance_souhaitee
    ),
    date: row.date || row.dateSeance || row.date_souhaitee || "",
    debut: toHHMM(heureDebut),
    fin: row.fin ? toHHMM(row.fin) : addMinutes(heureDebut, duree),
    duree,
    salle: row.salle || row.salle_code || "-",
    cohorte: row.cohorte || row.cohorte_nom || "-",
    enseignant: row.enseignant || row.enseignant_nom || "",
    motif: row.motif || "",
    createdAt: row.createdAt || row.created_at || "",
  };
}

function mapSeanceRow(row = {}) {
  const debut = row.heureDebut || row.debut || "00:00";
  const duree = Number(row.duree || 0);

  return {
    id: String(row.id ?? ""),
    date: row.dateSeance || row.date || "",
    debut: toHHMM(debut),
    fin: addMinutes(debut, duree),
    type: normalizeType(row.typeSeance || row.type),
    statut: row.statut || "",
    cohorteId: row.cohorte_id ?? null,
    enseignantId: row.enseignant_id ?? null,
    cohorte: row.cohorte_nom || row.cohorte || "-",
    matiere: row.matiere_nom || row.matiere || "Cours",
    salle: row.salle_code || row.salle || "-",
    description: row.description || "",
    duree,
  };
}



export async function getMe() {
  return request("/api/users/me", { auth: true });
}

export async function refreshStoredUser() {
  const user = await getMe();
  if (user) setUser(user);
  return user;
}

export async function getCurrentUserProfile() {
  const localUser = getUser();
  if (isObject(localUser)) return localUser;

  try {
    return await refreshStoredUser();
  } catch {
    return null;
  }
}

export async function getEnseignantCours({ enseignantId = null } = {}) {
  const user = getUser();

  const effectiveId =
    Number(enseignantId) ||
    Number(user?.id) ||
    DEFAULT_ENSEIGNANT_ID;

  const rows = await request(`/api/planning/enseignant/${effectiveId}`, {
    auth: true,
  });

  return Array.isArray(rows) ? rows.map(mapPlanningRow) : [];
}

export async function getEtudiantCours({ cohorteId = null } = {}) {
  const user = getUser();

  const effectiveCohorteId =
    Number(cohorteId) ||
    Number(user?.cohorte_id) ||
    Number(user?.cohorteId) ||
    DEFAULT_COHORTE_ID;

  const rows = await request(`/api/planning/cohorte/${effectiveCohorteId}`, {
    auth: true,
  });

  return Array.isArray(rows) ? rows.map(mapPlanningRow) : [];
}

export async function getSeanceDetailsForEnseignant(
  id,
  { enseignantId = null } = {}
) {
  const rows = await getEnseignantCours({ enseignantId });
  return rows.find((item) => String(item.id) === String(id)) || null;
}

export async function getSeanceDetailsForEtudiant(
  id,
  { cohorteId = null } = {}
) {
  const rows = await getEtudiantCours({ cohorteId });
  return rows.find((item) => String(item.id) === String(id)) || null;
}


export async function getDemandes() {
  const rows = await request("/api/reservations/front", { auth: true });
  return Array.isArray(rows) ? rows.map(mapReservationFrontRow) : [];
}

export async function getReservations() {
  const rows = await request("/api/reservations", { auth: true });
  return Array.isArray(rows) ? rows.map(mapReservationFrontRow) : [];
}

export async function getReservationById(id) {
  const row = await request(`/api/reservations/${id}`, { auth: true });
  return isObject(row) ? mapReservationFrontRow(row) : null;
}

export async function createDemande(demande = {}) {
  const user = getUser();

  const demandeTypeFront =
    demande.demandeType ||
    demande.demande_type ||
    demande.demande_type_front ||
    "CREATION";

  const isMove =
    toUpper(demandeTypeFront) === "DEPLACEMENT" ||
    toUpper(demandeTypeFront) === "MODIFICATION";

  const debut = demande.debut || demande.heure_debut_souhaitee || null;
  const fin = demande.fin || null;

  const payload = {
    type_demande: normalizeBackendDemandeType(demandeTypeFront),
    seance_id:
      isMove
        ? demande.seance_id ?? demande.seanceId ?? null
        : null,
    source_reservation_id:
      demande.source_reservation_id ??
      demande.sourceReservationId ??
      null,
    salle_id: demande.salle_id ?? demande.salleId ?? null,
    motif: demande.motif || null,
    date_souhaitee:
      isMove ? null : (demande.date_souhaitee || demande.date || null),
    heure_debut_souhaitee:
      isMove ? null : (demande.heure_debut_souhaitee || debut || null),
    duree_souhaitee:
      isMove
        ? null
        : (
            Number(demande.duree_souhaitee) ||
            computeDurationMinutes(debut, fin) ||
            Number(demande.duree) ||
            null
          ),
    type_seance_souhaitee:
      isMove
        ? null
        : normalizeBackendType(
            demande.type_seance_souhaitee ||
            demande.type ||
            demande.typeSeance
          ) || null,
    cohorte_id: demande.cohorte_id ?? demande.cohorteId ?? null,
    enseignant_id:
      demande.enseignant_id ??
      demande.enseignantId ??
      user?.id ??
      null,
  };

  return request("/api/reservations", {
    method: "POST",
    data: payload,
    auth: true,
  });
}

export async function updateDemande(id, demande = {}) {
  const user = getUser();

  const payload = {
    type_demande:
      demande.type_demande !== undefined
        ? normalizeBackendDemandeType(demande.type_demande)
        : undefined,
    seance_id:
      demande.seance_id ?? demande.seanceId ?? undefined,
    source_reservation_id:
      demande.source_reservation_id ??
      demande.sourceReservationId ??
      undefined,
    salle_id:
      demande.salle_id ?? demande.salleId ?? undefined,
    motif:
      demande.motif ?? undefined,
    date_souhaitee:
      demande.date_souhaitee ?? demande.date ?? undefined,
    heure_debut_souhaitee:
      demande.heure_debut_souhaitee ?? demande.debut ?? undefined,
    duree_souhaitee:
      demande.duree_souhaitee !== undefined
        ? Number(demande.duree_souhaitee)
        : demande.duree !== undefined
        ? Number(demande.duree)
        : demande.debut && demande.fin
        ? computeDurationMinutes(demande.debut, demande.fin)
        : undefined,
    type_seance_souhaitee:
      demande.type_seance_souhaitee !== undefined ||
      demande.type !== undefined ||
      demande.typeSeance !== undefined
        ? normalizeBackendType(
            demande.type_seance_souhaitee ||
            demande.type ||
            demande.typeSeance
          )
        : undefined,
    cohorte_id:
      demande.cohorte_id ?? demande.cohorteId ?? undefined,
    enseignant_id:
      demande.enseignant_id ??
      demande.enseignantId ??
      user?.id ??
      undefined,
  };

  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  return request(`/api/reservations/${id}`, {
    method: "PUT",
    data: cleanedPayload,
    auth: true,
  });
}

export async function cancelDemande(id) {
  return request(`/api/reservations/${id}/cancel`, {
    method: "PATCH",
    auth: true,
  });
}

export async function getNotifications({ role } = {}) {
  const user = getUser();
  const effectiveRole = toLower(role || user?.role || "enseignant");

  try {
    const rows = await request(
      `/api/notifications?role=${encodeURIComponent(effectiveRole)}`,
      { auth: true }
    );

    if (!Array.isArray(rows)) return [];

    return rows.map((n) => ({
      id: String(n.id ?? ""),
      status: n.status || "nouveau",
      titre: n.titre || "Notification",
      message: n.message || "",
      date: n.date || "",
      iconType: n.iconType || "info",
      role: n.role || effectiveRole,
    }));
  } catch {
    const demandes = await getDemandes().catch(() => []);

    return demandes.slice(0, 20).map((d) => ({
      id: `notif-${effectiveRole}-${d.id}`,
      status: d.statut === "EN ATTENTE" ? "important" : "lu",
      titre:
        effectiveRole === "etudiant"
          ? "Mise à jour planning"
          : "Mise à jour réservation",
      message: `${d.type} - ${d.cohorte} - Salle ${d.salle} (${d.statut})`,
      date: d.date,
      iconType: d.statut === "REFUSÉE" ? "warning" : "info",
      role: effectiveRole,
    }));
  }
}

export async function getCohortes() {
  const rows = await request("/api/cohortes", { auth: true });
  return Array.isArray(rows) ? rows : [];
}

export async function getSalles() {
  const rows = await request("/api/salles", { auth: true });

  if (!Array.isArray(rows)) return [];

  return rows.map((s) => ({
    id: s.id,
    code: s.code || `Salle ${s.id}`,
    capacite: s.capacite,
    type: s.type,
    accessibilitePMR: s.accessibilitePMR,
    isActive: s.isActive,
  }));
}

export async function getSeances() {
  const rows = await request("/api/seances", { auth: true });
  return Array.isArray(rows) ? rows.map(mapSeanceRow) : [];
}

export async function getConflits() {
  const rows = await request("/api/conflits", { auth: true });
  return Array.isArray(rows) ? rows : [];
}

export async function getUsers() {
  const rows = await request("/api/users", { auth: true });
  return Array.isArray(rows) ? rows : [];
}