import { useEffect, useMemo, useState } from "react";
import "../styles/AdminSalles.css";
import {
  getSalles,
  createSalle,
  updateSalle,
  deleteSalle,
} from "../../services/api";

const SALLE_TYPES = ["AMPHI", "TD", "TP", "LABO", "INFO"];

const ROOM_TYPE_OPTIONS = [
  { value: "ALL", label: "Tous les types" },
  { value: "AMPHI", label: "Amphithéâtre" },
  { value: "TD", label: "Salle TD" },
  { value: "TP", label: "Salle TP" },
  { value: "LABO", label: "Laboratoire" },
  { value: "INFO", label: "Salle informatique" },
];

const INITIAL_FORM = {
  code: "",
  capacite: "",
  type: "TD",
  accessibilitePMR: "0",
  isActive: "1",
};

function sortRooms(a, b) {
  return a.code.localeCompare(b.code, "fr", { sensitivity: "base" });
}

function getSalleTypeLabel(type) {
  switch (String(type || "").toUpperCase()) {
    case "AMPHI":
      return "Amphithéâtre";
    case "TD":
      return "Salle TD";
    case "TP":
      return "Salle TP";
    case "LABO":
      return "Laboratoire";
    case "INFO":
      return "Salle informatique";
    default:
      return type || "Non renseigné";
  }
}

function getSalleStatusLabel(room) {
  return Number(room?.isActive) === 1 ? "Disponible" : "Inactive";
}

function getSalleStatusTone(room) {
  return Number(room?.isActive) === 1 ? "available" : "inactive";
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildSallePayload(form) {
  return {
    code: String(form.code || "").trim(),
    capacite: Number(form.capacite),
    type: String(form.type || "").toUpperCase(),
    accessibilitePMR: Number(form.accessibilitePMR),
    isActive: Number(form.isActive),
  };
}

async function fetchSalles() {
  const rows = await getSalles();
  return rows.sort(sortRooms);
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CapacityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 21V19C16 17.3431 14.6569 16 13 16H7C5.34315 16 4 17.3431 4 19V21M20 21V19C20 18.1091 19.6118 17.2708 18.9497 16.7147C18.2877 16.1586 17.4194 15.9416 16.58 16.12M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM19 8C19 9.65685 17.6569 11 16 11C15.3503 11 14.7488 10.7931 14.2583 10.441"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20H21M16.5 3.5C16.8978 3.10218 17.4374 2.87866 18 2.87866C18.5626 2.87866 19.1022 3.10218 19.5 3.5C19.8978 3.89782 20.1213 4.43739 20.1213 5C20.1213 5.56261 19.8978 6.10218 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6M10 11V17M14 11V17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminSalles() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRooms() {
      setLoading(true);
      setApiError("");

      try {
        const nextRooms = await fetchSalles();
        if (isMounted) {
          setRooms(nextRooms);
        }
      } catch (error) {
        if (isMounted) {
          setRooms([]);
          setApiError(error.message || "Impossible de charger les salles depuis l'API.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRooms = useMemo(() => {
    const query = normalizeText(searchTerm.trim());

    return rooms.filter((room) => {
      const matchesSearch =
        !query ||
        normalizeText(
          [
            room.code,
            room.type,
            getSalleTypeLabel(room.type),
            getSalleStatusLabel(room),
            room.capacite,
            room.accessibilitePMR ? "pmr" : "",
          ].join(" ")
        ).includes(query);

      const matchesType = typeFilter === "ALL" || room.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [rooms, searchTerm, typeFilter]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setFormError("");
    setFormMode("create");
    setEditingRoomId(null);
  }

  function handleOpenCreate() {
    setApiError("");
    setIsFormOpen((current) => {
      if (current && formMode === "create") {
        resetForm();
        return false;
      }

      resetForm();
      return true;
    });
  }

  function handleEdit(room) {
    setApiError("");
    setFormError("");
    setFormMode("edit");
    setEditingRoomId(room.id);
    setForm({
      code: room.code,
      capacite: String(room.capacite),
      type: room.type,
      accessibilitePMR: String(room.accessibilitePMR),
      isActive: String(room.isActive),
    });
    setIsFormOpen(true);
  }

  function handleFormChange(field) {
    return (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setApiError("");

    const payload = buildSallePayload(form);

    if (!payload.code || !Number.isInteger(payload.capacite) || payload.capacite <= 0) {
      setFormError("Veuillez renseigner un code et une capacité valide.");
      return;
    }

    if (!SALLE_TYPES.includes(payload.type)) {
      setFormError("Veuillez sélectionner un type valide.");
      return;
    }

    setSubmitting(true);

    try {
      if (formMode === "edit" && editingRoomId !== null) {
        const response = await updateSalle(editingRoomId, payload);
        const updatedRoom = response?.salle
          ? {
              id: response.salle.id,
              code: response.salle.code || "",
              capacite: Number(response.salle.capacite ?? 0),
              type: String(response.salle.type || "").toUpperCase(),
              accessibilitePMR: Number(response.salle.accessibilitePMR ?? 0),
              isActive: Number(response.salle.isActive ?? 0),
            }
          : { id: editingRoomId, ...payload };

        setRooms((currentRooms) =>
          currentRooms
            .map((room) => (room.id === editingRoomId ? updatedRoom : room))
            .sort(sortRooms)
        );
      } else {
        const response = await createSalle(payload);
        const createdRoom = response?.salle
          ? {
              id: response.salle.id,
              code: response.salle.code || "",
              capacite: Number(response.salle.capacite ?? 0),
              type: String(response.salle.type || "").toUpperCase(),
              accessibilitePMR: Number(response.salle.accessibilitePMR ?? 0),
              isActive: Number(response.salle.isActive ?? 0),
            }
          : { id: Date.now(), ...payload };

        setRooms((currentRooms) => [...currentRooms, createdRoom].sort(sortRooms));
      }

      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      setFormError(error.message || "Enregistrement impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(room) {
    const confirmed = window.confirm(`Supprimer la salle ${room.code} ?`);
    if (!confirmed) return;

    setApiError("");
    setDeletingId(room.id);

    try {
      await deleteSalle(room.id);

      setRooms((currentRooms) =>
        currentRooms.filter((currentRoom) => currentRoom.id !== room.id)
      );

      if (editingRoomId === room.id) {
        resetForm();
        setIsFormOpen(false);
      }
    } catch (error) {
      setApiError(error.message || "Suppression impossible.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-salles-page">
      <div className="admin-salles-shell">
        <header className="admin-salles-header">
          <div className="admin-salles-heading">
            <h1 className="admin-salles-title">Gestion des salles</h1>
            <p className="admin-salles-description">
              Gérez les salles, leurs capacités et les informations disponibles dans la base.
            </p>
          </div>

          <div className="admin-salles-toolbar">
            <label className="admin-salles-search">
              <SearchIcon />
              <input
                type="search"
                placeholder="Rechercher une salle..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Rechercher une salle"
              />
            </label>

            <button type="button" className="admin-salles-add-button" onClick={handleOpenCreate}>
              <PlusIcon />
              <span>
                {isFormOpen && formMode === "create"
                  ? "Fermer le formulaire"
                  : "Ajouter une salle"}
              </span>
            </button>
          </div>
        </header>

        {isFormOpen ? (
          <section className="admin-salles-panel" style={{ marginBottom: 18 }}>
            <div className="admin-salles-panel-top">
              <div className="admin-salles-panel-heading">
                <h2 className="admin-salles-panel-title">
                  {formMode === "edit" ? "Modifier une salle" : "Ajouter une salle"}
                </h2>
                <p className="admin-salles-panel-text">
                  Renseignez les champs backend réels : code, capacité, type, accessibilité PMR
                  et statut.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 18 }}>
              {formError ? (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #ffd6d6",
                    background: "#fff5f5",
                    color: "#b42318",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                  }}
                >
                  {formError}
                </div>
              ) : null}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: 14,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span
                    style={{
                      color: "#7b91b2",
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    Code
                  </span>
                  <input
                    type="text"
                    value={form.code}
                    onChange={handleFormChange("code")}
                    placeholder="Ex: A101"
                    style={{
                      height: 40,
                      padding: "0 12px",
                      border: "1px solid #dbe3ed",
                      borderRadius: 10,
                      fontSize: "0.84rem",
                      outline: "none",
                    }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span
                    style={{
                      color: "#7b91b2",
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    Capacité
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={form.capacite}
                    onChange={handleFormChange("capacite")}
                    placeholder="Ex: 40"
                    style={{
                      height: 40,
                      padding: "0 12px",
                      border: "1px solid #dbe3ed",
                      borderRadius: 10,
                      fontSize: "0.84rem",
                      outline: "none",
                    }}
                  />
                </label>

                <label className="admin-salles-filter" style={{ minWidth: 0 }}>
                  <span>Type</span>
                  <select value={form.type} onChange={handleFormChange("type")}>
                    {ROOM_TYPE_OPTIONS.filter((option) => option.value !== "ALL").map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-salles-filter" style={{ minWidth: 0 }}>
                  <span>Accessibilité PMR</span>
                  <select
                    value={form.accessibilitePMR}
                    onChange={handleFormChange("accessibilitePMR")}
                  >
                    <option value="1">Oui</option>
                    <option value="0">Non</option>
                  </select>
                </label>

                <label className="admin-salles-filter" style={{ minWidth: 0 }}>
                  <span>Statut</span>
                  <select value={form.isActive} onChange={handleFormChange("isActive")}>
                    <option value="1">Disponible</option>
                    <option value="0">Inactive</option>
                  </select>
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  marginTop: 18,
                }}
              >
                <button
                  type="button"
                  className="admin-salles-action"
                  onClick={() => {
                    resetForm();
                    setIsFormOpen(false);
                  }}
                  style={{ width: "auto", padding: "0 14px" }}
                >
                  Annuler
                </button>

                <button type="submit" className="admin-salles-add-button" disabled={submitting}>
                  {submitting
                    ? formMode === "edit"
                      ? "Enregistrement..."
                      : "Création..."
                    : formMode === "edit"
                    ? "Enregistrer"
                    : "Créer la salle"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="admin-salles-panel">
          <div className="admin-salles-panel-top">
            <div className="admin-salles-panel-heading">
              <h2 className="admin-salles-panel-title">Liste des salles</h2>
              <p className="admin-salles-panel-text">
                {loading
                  ? "Chargement des salles..."
                  : `${filteredRooms.length} salle${filteredRooms.length > 1 ? "s" : ""} affichée${
                      filteredRooms.length > 1 ? "s" : ""
                    }`}
              </p>
            </div>

            <label className="admin-salles-filter">
              <span>Type</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                aria-label="Filtrer les salles par type"
              >
                {ROOM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {apiError ? (
            <div
              style={{
                margin: "16px 18px 0",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ffd6d6",
                background: "#fff5f5",
                color: "#b42318",
                fontSize: "0.84rem",
                fontWeight: 600,
              }}
            >
              {apiError}
            </div>
          ) : null}

          {loading ? (
            <div className="admin-salles-empty">Chargement des salles...</div>
          ) : rooms.length === 0 ? (
            <div className="admin-salles-empty">
              Aucune salle n&apos;est enregistrée dans la base pour le moment.
            </div>
          ) : filteredRooms.length > 0 ? (
            <div className="admin-salles-table-wrap">
              <table className="admin-salles-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Capacité</th>
                    <th>Équipements</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRooms.map((room) => (
                    <tr key={room.id}>
                      <td>
                        <div className="admin-salles-room-name">
                          <span className="admin-salles-room-title">{room.code}</span>
                        </div>
                      </td>

                      <td>
                        <span className="admin-salles-type-badge">
                          {getSalleTypeLabel(room.type)}
                        </span>
                      </td>

                      <td>
                        <span className="admin-salles-capacity">
                          <CapacityIcon />
                          {room.capacite}
                        </span>
                      </td>

                      <td>
                        <div className="admin-salles-equipment-list">
                          <span className="admin-salles-equipment-badge">À connecter</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-salles-status-badge admin-salles-status-badge--${getSalleStatusTone(
                            room
                          )}`}
                        >
                          {getSalleStatusLabel(room)}
                        </span>
                      </td>

                      <td>
                        <div className="admin-salles-actions">
                          <button
                            type="button"
                            className="admin-salles-action admin-salles-action--edit"
                            aria-label={`Modifier ${room.code}`}
                            onClick={() => handleEdit(room)}
                            disabled={submitting || deletingId === room.id}
                          >
                            <EditIcon />
                          </button>

                          <button
                            type="button"
                            className="admin-salles-action admin-salles-action--delete"
                            aria-label={`Supprimer ${room.code}`}
                            onClick={() => handleDelete(room)}
                            disabled={deletingId === room.id}
                            title={
                              deletingId === room.id
                                ? "Suppression..."
                                : `Supprimer ${room.code}`
                            }
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-salles-empty">
              Aucune salle ne correspond à votre recherche pour le moment.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}