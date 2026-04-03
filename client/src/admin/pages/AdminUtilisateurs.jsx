import { useEffect, useMemo, useState } from "react";
import { request } from "../../services/api";
import "../styles/AdminUtilisateurs.css";

const TABS = [
  { key: "etudiants", label: "Étudiants" },
  { key: "enseignants", label: "Enseignants" },
];

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  email: "",
  role: "enseignant",
  mot_de_passe: "",
  service: "",
  grade: "",
  numeroEtudiant: "",
  annee: "",
  filiere: "",
  cohorte_id: "",
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const sortByName = (a, b) => {
  const byNom = String(a.nom || "").localeCompare(String(b.nom || ""), "fr", {
    sensitivity: "base",
  });
  if (byNom !== 0) return byNom;
  return String(a.prenom || "").localeCompare(String(b.prenom || ""), "fr", {
    sensitivity: "base",
  });
};

const getInitials = (prenom, nom) =>
  `${String(prenom || "").trim().charAt(0)}${String(nom || "").trim().charAt(0)}`
    .toUpperCase() || "US";

const buildCsv = (rows) =>
  rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

async function safeDelete(path) {
  try {
    await request(path, { method: "DELETE", auth: true });
  } catch (error) {
    if (!/introuvable/i.test(error.message || "")) throw error;
  }
}

function mapTeacher(row) {
  return {
    id: row.id,
    nom: row.nom || "",
    prenom: row.prenom || "",
    email: row.email || "",
    role: "enseignant",
    service: row.service || "",
    grade: row.grade || "",
    created_at: row.created_at || null,
    initials: getInitials(row.prenom, row.nom),
  };
}

function mapStudent(row) {
  return {
    id: row.id,
    nom: row.nom || "",
    prenom: row.prenom || "",
    email: row.email || "",
    role: "etudiant",
    numeroEtudiant: row.numeroEtudiant || "",
    annee: row.annee ?? "",
    filiere: row.filiere || "",
    cohorte_id: row.cohorte_id ?? "",
    cohorte_nom: row.cohorte_nom || "",
    created_at: row.created_at || null,
    initials: getInitials(row.prenom, row.nom),
  };
}

export default function AdminUtilisateurs() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("enseignants");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const teacherIds = useMemo(() => new Set(teachers.map((row) => Number(row.id))), [teachers]);
  const studentIds = useMemo(() => new Set(students.map((row) => Number(row.id))), [students]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [teachersRows, studentsRows, cohortesRows] = await Promise.all([
        request("/api/enseignants", { auth: true }),
        request("/api/etudiants", { auth: true }),
        request("/api/cohortes", { auth: true }),
      ]);
      setTeachers(Array.isArray(teachersRows) ? teachersRows.map(mapTeacher).sort(sortByName) : []);
      setStudents(Array.isArray(studentsRows) ? studentsRows.map(mapStudent).sort(sortByName) : []);
      setCohortes(Array.isArray(cohortesRows) ? cohortesRows : []);
    } catch (apiError) {
      setError(apiError.message || "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const rows = tab === "enseignants" ? teachers : students;

  const filteredRows = useMemo(() => {
    const query = normalizeText(search.trim());
    if (!query) return rows;
    return rows.filter((row) =>
      normalizeText(
        tab === "enseignants"
          ? [row.nom, row.prenom, row.email, row.service, row.grade].join(" ")
          : [row.nom, row.prenom, row.email, row.filiere, row.cohorte_nom, row.numeroEtudiant].join(" ")
      ).includes(query)
    );
  }, [rows, search, tab]);

  const stats = useMemo(
    () => ({
      etudiants: students.length,
      enseignants: teachers.length,
      actifs: students.length + teachers.length,
      total: students.length + teachers.length,
    }),
    [students.length, teachers.length]
  );

  function resetForm(nextRole = tab === "enseignants" ? "enseignant" : "etudiant") {
    setForm({ ...EMPTY_FORM, role: nextRole });
    setFormError("");
    setEditingRecord(null);
    setModalMode("create");
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingRecord(row);
    setModalMode("edit");
    setFormError("");
    setForm({
      nom: row.nom || "",
      prenom: row.prenom || "",
      email: row.email || "",
      role: row.role,
      mot_de_passe: "",
      service: row.service || "",
      grade: row.grade || "",
      numeroEtudiant: row.numeroEtudiant || "",
      annee: row.annee ? String(row.annee) : "",
      filiere: row.filiere || "",
      cohorte_id: row.cohorte_id ? String(row.cohorte_id) : "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError("");
  }

  function setField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function syncRoleDetails(userId, nextRole, previousRole) {
    if (previousRole === "enseignant" && nextRole !== "enseignant") {
      await safeDelete(`/api/enseignants/${userId}`);
    }
    if (previousRole === "etudiant" && nextRole !== "etudiant") {
      await safeDelete(`/api/etudiants/${userId}`);
    }

    if (nextRole === "enseignant") {
      const payload = {
        id: userId,
        service: String(form.service || "").trim() || null,
        grade: String(form.grade || "").trim() || null,
      };
      await request(teacherIds.has(Number(userId)) ? `/api/enseignants/${userId}` : "/api/enseignants", {
        method: teacherIds.has(Number(userId)) ? "PUT" : "POST",
        data: payload,
        auth: true,
      });
    }

    if (nextRole === "etudiant") {
      const numeroEtudiant = String(form.numeroEtudiant || "").trim();
      if (!numeroEtudiant) {
        throw new Error("Le numéro étudiant est requis pour un compte étudiant.");
      }
      const payload = {
        id: userId,
        numeroEtudiant,
        annee: form.annee ? Number(form.annee) : null,
        filiere: String(form.filiere || "").trim() || null,
        cohorte_id: form.cohorte_id ? Number(form.cohorte_id) : null,
      };
      await request(studentIds.has(Number(userId)) ? `/api/etudiants/${userId}` : "/api/etudiants", {
        method: studentIds.has(Number(userId)) ? "PUT" : "POST",
        data: payload,
        auth: true,
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    setError("");

    const payload = {
      nom: String(form.nom || "").trim(),
      prenom: String(form.prenom || "").trim(),
      email: String(form.email || "").trim(),
      role: String(form.role || "").trim().toLowerCase(),
    };

    if (!payload.nom || !payload.prenom || !payload.email || !payload.role) {
      setFormError("Veuillez remplir nom, prénom, email et rôle.");
      setSubmitting(false);
      return;
    }

    if (!["enseignant", "etudiant"].includes(payload.role)) {
      setFormError("Seuls les comptes étudiant et enseignant sont gérés sur cette page.");
      setSubmitting(false);
      return;
    }

    if (modalMode === "create" && !String(form.mot_de_passe || "").trim()) {
      setFormError("Le mot de passe est obligatoire à la création.");
      setSubmitting(false);
      return;
    }

    if (String(form.mot_de_passe || "").trim()) {
      payload.mot_de_passe = form.mot_de_passe;
    }

    try {
      if (modalMode === "edit" && editingRecord) {
        await request(`/api/users/${editingRecord.id}`, {
          method: "PUT",
          data: payload,
          auth: true,
        });
        await syncRoleDetails(editingRecord.id, payload.role, editingRecord.role);
      } else {
        const response = await request("/api/users", {
          method: "POST",
          data: payload,
          auth: true,
        });
        await syncRoleDetails(response?.user?.id, payload.role, null);
      }

      closeModal();
      await loadData();
    } catch (apiError) {
      setFormError(apiError.message || "Enregistrement impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Supprimer ${row.prenom} ${row.nom} ?`)) return;
    setDeletingId(row.id);
    setError("");
    try {
      await request(`/api/users/${row.id}`, { method: "DELETE", auth: true });
      if (editingRecord?.id === row.id) closeModal();
      await loadData();
    } catch (apiError) {
      setError(apiError.message || "Suppression impossible.");
    } finally {
      setDeletingId(null);
    }
  }

  function exportCurrentRows() {
    const csvRows =
      tab === "enseignants"
        ? [["Nom", "Prénom", "Email", "Département", "Spécialisation", "Statut"]]
            .concat(filteredRows.map((row) => [row.nom, row.prenom, row.email, row.service || "Non renseigné", row.grade || "Non renseigné", "Actif"]))
        : [["Nom", "Prénom", "Email", "Filière", "Cohorte", "Statut"]]
            .concat(filteredRows.map((row) => [row.nom, row.prenom, row.email, row.filiere || "Non renseigné", row.cohorte_nom || "Non renseigné", "Actif"]));

    const blob = new Blob([buildCsv(csvRows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `utilisateurs_${tab}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const currentCount = tab === "enseignants" ? stats.enseignants : stats.etudiants;
  const emptyMessage = search.trim()
    ? "Aucun résultat pour cette recherche."
    : `Aucun ${tab === "enseignants" ? "enseignant" : "étudiant"} trouvé dans la base de données.`;

  return (
    <div className="admin-users-page">
      

      <section className="admin-users-header-card">
        <div className="admin-users-header-top">
          <h1 className="admin-users-title">Gestion des utilisateurs</h1>
          <label className="admin-users-top-search">
            <span className="admin-users-search-icon">⌕</span>
            <input
              type="search"
              placeholder="Rechercher..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="admin-users-toolbar">
          <p className="admin-users-subtitle">Gérez les étudiants et enseignants de la plateforme</p>
          <div className="admin-users-toolbar-actions">
            <button type="button" className="admin-users-btn admin-users-btn--ghost" onClick={() => window.alert("Import CSV à connecter.")}>
              Importer CSV
            </button>
            <button
              type="button"
              className="admin-users-btn admin-users-btn--ghost"
              onClick={exportCurrentRows}
              disabled={loading || filteredRows.length === 0}
            >
              Exporter
            </button>
            <button type="button" className="admin-users-btn admin-users-btn--primary" onClick={openCreate}>
              Ajouter
            </button>
          </div>
        </div>

        <div className="admin-users-tabs">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-users-tab ${tab === item.key ? "is-active" : ""}`}
              onClick={() => setTab(item.key)}
            >
              <span>{item.label}</span>
              <span className="admin-users-tab-count">
                {item.key === "enseignants" ? stats.enseignants : stats.etudiants}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="admin-users-search-card">
        <label className="admin-users-main-search">
          <span className="admin-users-search-icon">⌕</span>
          <input
            type="search"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      <section className="admin-users-table-card">
        <div className="admin-users-table-title">
          Liste des {tab === "enseignants" ? "enseignants" : "étudiants"} ({currentCount})
        </div>

        {error ? <div className="admin-users-feedback admin-users-feedback--error">{error}</div> : null}
        {loading ? <div className="admin-users-feedback">Chargement des utilisateurs...</div> : null}
        {!loading && filteredRows.length === 0 ? (
          <div className="admin-users-feedback">{emptyMessage}</div>
        ) : null}

        {!loading && filteredRows.length > 0 ? (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>{tab === "enseignants" ? "Enseignant" : "Étudiant"}</th>
                  <th>Email</th>
                  <th>{tab === "enseignants" ? "Département" : "Filière"}</th>
                  <th>{tab === "enseignants" ? "Spécialisation" : "Cohorte"}</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="admin-users-person">
                        <div className="admin-users-avatar">{row.initials}</div>
                        <div className="admin-users-person-content">
                          <div className="admin-users-person-name">
                            {row.prenom} {row.nom}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-users-email">✉ {row.email}</div>
                    </td>
                    <td>
                      <span className="admin-users-soft-badge">
                        {tab === "enseignants" ? row.service || "Non renseigné" : row.filiere || "Non renseigné"}
                      </span>
                    </td>
                    <td>{tab === "enseignants" ? row.grade || "Non renseigné" : row.cohorte_nom || "Non renseigné"}</td>
                    <td>
                      <span className="admin-users-status">Actif</span>
                    </td>
                    <td>
                      <div className="admin-users-row-actions">
                        <button type="button" className="admin-users-icon-btn" onClick={() => openEdit(row)}>
                          ✎
                        </button>
                        <button
                          type="button"
                          className="admin-users-icon-btn is-danger"
                          onClick={() => handleDelete(row)}
                          disabled={deletingId === row.id}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {modalOpen ? (
        <div className="admin-users-modal-backdrop" onClick={closeModal}>
          <div className="admin-users-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-users-modal-header">
              <div>
                <h3>{modalMode === "edit" ? "Modifier un utilisateur" : "Ajouter un utilisateur"}</h3>
                <p>Renseignez les données du compte et les champs enseignant/étudiant utiles.</p>
              </div>
              <button type="button" className="admin-users-close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            {formError ? <div className="admin-users-feedback admin-users-feedback--error">{formError}</div> : null}

            <form className="admin-users-form" onSubmit={handleSubmit}>
              <div className="admin-users-form-grid">
                <label className="admin-users-field"><span>Nom</span><input value={form.nom} onChange={setField("nom")} /></label>
                <label className="admin-users-field"><span>Prénom</span><input value={form.prenom} onChange={setField("prenom")} /></label>
                <label className="admin-users-field"><span>Email</span><input type="email" value={form.email} onChange={setField("email")} /></label>
                <label className="admin-users-field">
                  <span>Rôle</span>
                  <select value={form.role} onChange={setField("role")}>
                    <option value="enseignant">Enseignant</option>
                    <option value="etudiant">Étudiant</option>
                  </select>
                </label>
                <label className="admin-users-field">
                  <span>{modalMode === "edit" ? "Mot de passe (optionnel)" : "Mot de passe"}</span>
                  <input type="password" value={form.mot_de_passe} onChange={setField("mot_de_passe")} />
                </label>

                {form.role === "enseignant" ? (
                  <>
                    <label className="admin-users-field"><span>Département</span><input value={form.service} onChange={setField("service")} /></label>
                    <label className="admin-users-field"><span>Spécialisation</span><input value={form.grade} onChange={setField("grade")} /></label>
                  </>
                ) : null}

                {form.role === "etudiant" ? (
                  <>
                    <label className="admin-users-field"><span>Numéro étudiant</span><input value={form.numeroEtudiant} onChange={setField("numeroEtudiant")} /></label>
                    <label className="admin-users-field"><span>Année</span><input type="number" min="1" value={form.annee} onChange={setField("annee")} /></label>
                    <label className="admin-users-field"><span>Filière</span><input value={form.filiere} onChange={setField("filiere")} /></label>
                    <label className="admin-users-field">
                      <span>Cohorte</span>
                      <select value={form.cohorte_id} onChange={setField("cohorte_id")}>
                        <option value="">Aucune</option>
                        {cohortes.map((cohorte) => (
                          <option key={cohorte.id} value={cohorte.id}>{cohorte.nom}</option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : null}
              </div>

              <div className="admin-users-form-actions">
                <button type="button" className="admin-users-btn admin-users-btn--ghost" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="admin-users-btn admin-users-btn--primary" disabled={submitting}>
                  {submitting ? "Enregistrement..." : modalMode === "edit" ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <section className="admin-users-stats">
        <article className="admin-users-stat-card">
          <div className="admin-users-stat-value">{stats.etudiants}</div>
          <div className="admin-users-stat-label">Étudiants</div>
        </article>
        <article className="admin-users-stat-card">
          <div className="admin-users-stat-value">{stats.enseignants}</div>
          <div className="admin-users-stat-label">Enseignants</div>
        </article>
        <article className="admin-users-stat-card">
          <div className="admin-users-stat-value">{stats.actifs}</div>
          <div className="admin-users-stat-label">Utilisateurs actifs</div>
        </article>
        <article className="admin-users-stat-card">
          <div className="admin-users-stat-value">{stats.total}</div>
          <div className="admin-users-stat-label">Total utilisateurs</div>
        </article>
      </section>
    </div>
  );
}
