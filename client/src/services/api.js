const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

const DEFAULT_ENSEIGNANT_ID = Number(process.env.REACT_APP_ENSEIGNANT_ID || 2);
const DEFAULT_COHORTE_ID = Number(process.env.REACT_APP_COHORTE_ID || 1);

function normalizeType(type = "") {
  const t = String(type).toUpperCase();
  if (t === "EXAMEN") return "EXAM";
  return t;
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
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth && token) {
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

function mapPlanningRow(row) {
  return {
    id: String(row.id),
    matiere: row.matiere || "Cours",
    titre: row.titre || row.matiere || "Séance",
    salle: row.salle || "-",
    date: row.date || "",
    debut: row.debut ? toHHMM(row.debut) : "00:00",
    fin: row.fin ? toHHMM(row.fin) : "00:00",
    type: normalizeType(row.type),
    enseignant: row.enseignant || "",
    cohorte: row.cohorte || "",
    description: row.description || "",
    statut: row.statut || "",
    duree: Number(row.duree || 0),
  };
}
function mapReservationFrontRow(row) {
  const debut = row.debut || row.heureDebut || "00:00";
  const duree = Number(row.duree || 0);

  return {
    id: String(row.id),
    seanceId: row.seanceId || row.seance_id || null,
    type: normalizeType(row.type),
    date: row.date || "",
    debut: toHHMM(debut),
    fin: row.fin ? toHHMM(row.fin) : addMinutes(debut, duree),
    cohorteId: row.cohorteId || row.cohorte_id || null,
    cohorte: row.cohorte || "-",
    salleId: row.salleId || row.salle_id || null,
    salle: row.salle || "-",
    statut: row.statut || "EN ATTENTE",
    demandeType: row.demandeType || row.demande_type || "CREATION",
    sourceReservationId: row.sourceReservationId || row.source_reservation_id || null,
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    enseignant: row.enseignant || "",
    motif: row.motif || "",
    duree,
  };
}

function mapSeanceRow(row) {
  return {
    id: String(row.id),
    date: row.dateSeance,
    debut: toHHMM(row.heureDebut),
    fin: addMinutes(row.heureDebut, row.duree),
    type: normalizeType(row.typeSeance),
    statut: row.statut,
    cohorteId: row.cohorte_id,
    enseignantId: row.enseignant_id,
    cohorte: row.cohorte_nom || "-",
    matiere: row.matiere_nom || "Cours",
    salle: row.salle_code || "-",
  };
}

export async function getEnseignantCours(
  { enseignantId = DEFAULT_ENSEIGNANT_ID } = {}
) {
  const rows = await request(`/api/planning/enseignant/${enseignantId}`, {
    auth: true,
  });
  return Array.isArray(rows) ? rows.map(mapPlanningRow) : [];
}

export async function getEtudiantCours(
  { cohorteId = DEFAULT_COHORTE_ID } = {}
) {
  const rows = await request(`/api/planning/cohorte/${cohorteId}`, {
    auth: true,
  });
  return Array.isArray(rows) ? rows.map(mapPlanningRow) : [];
}

export async function getSeanceDetailsForEnseignant(
  id,
  { enseignantId = DEFAULT_ENSEIGNANT_ID } = {}
) {
  const rows = await getEnseignantCours({ enseignantId });
  return rows.find((item) => String(item.id) === String(id)) || null;
}

export async function getSeanceDetailsForEtudiant(
  id,
  { cohorteId = DEFAULT_COHORTE_ID } = {}
) {
  const rows = await getEtudiantCours({ cohorteId });
  return rows.find((item) => String(item.id) === String(id)) || null;
}

export async function getDemandes() {
  const rows = await request("/api/reservations/front", { auth: true });
  return Array.isArray(rows) ? rows.map(mapReservationFrontRow) : [];
}
export async function createDemande(demande) {
  const {
    type,
    date,
    debut,
    fin,
    cohorte_id,
    salle_id,
    enseignant_id,
    demande_type,
    motif,
    seance_id,
    source_reservation_id,
  } = demande;

  let duree_souhaitee = null;
  if (debut && fin) {
    const [dh, dm] = debut.split(":").map(Number);
    const [fh, fm] = fin.split(":").map(Number);
    duree_souhaitee = fh * 60 + fm - (dh * 60 + dm);
  }

  const payload = {
    type_demande: demande_type === "DEPLACEMENT" ? "MODIFICATION" : "AJOUT",
    seance_id: seance_id || null,
    source_reservation_id: source_reservation_id || null,
    salle_id: salle_id || null,
    date_souhaitee: date || null,
    heure_debut_souhaitee: debut || null,
    duree_souhaitee: duree_souhaitee || null,
    type_seance_souhaitee: type || null,
    cohorte_id: cohorte_id || null,
    enseignant_id: enseignant_id || getUser()?.id || null,
    motif: motif || null,
  };

  return request("/api/reservations", {
    method: "POST",
    data: payload,
    auth: true,
  });
}

export async function getNotifications({ role } = {}) {
  const user = getUser();
  const effectiveRole = role || user?.role || "enseignant";

  try {
    const rows = await request(
      `/api/notifications?role=${encodeURIComponent(effectiveRole)}`,
      { auth: true }
    );

    if (!Array.isArray(rows)) return [];

    return rows.map((n) => ({
      id: String(n.id),
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
          ? "Mise a jour planning"
          : "Mise a jour reservation",
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
  }));
}

export async function getReservations() {
  const rows = await request("/api/reservations", { auth: true });
  return Array.isArray(rows) ? rows : [];
}

export async function getSeances() {
  const rows = await request("/api/seances", { auth: true });
  if (!Array.isArray(rows)) return [];
  return rows.map(mapSeanceRow);
}

export async function getConflits() {
  const rows = await request("/api/conflits", { auth: true });
  return Array.isArray(rows) ? rows : [];
}

export async function getUsers() {
  const rows = await request("/api/users", { auth: true });
  return Array.isArray(rows) ? rows : [];
}