import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminReservations.css";

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const TODAY_KEY = toDateKey(new Date());
const TOMORROW_KEY = toDateKey(addDays(new Date(), 1));
const IN_TWO_DAYS_KEY = toDateKey(addDays(new Date(), 2));
const NEXT_WEEK_KEY = toDateKey(addDays(new Date(), 7));

const MOCK_RESERVATIONS = [
  {
    id: "res-001",
    teacher: "Dr. Martin",
    sessionType: "CM",
    date: TOMORROW_KEY,
    startTime: "14:00",
    endTime: "16:00",
    cohort: "M1 Informatique",
    room: "Amphi B",
    status: "EN_ATTENTE",
    hasConflict: false,
    priority: "HAUTE",
    comment: "Demande de réservation pour une séance de cours.",
    conflictDetails: null,
  },
  {
    id: "res-002",
    teacher: "Prof. Dupont",
    sessionType: "TP",
    date: TODAY_KEY,
    startTime: "10:00",
    endTime: "12:00",
    cohort: "L3 Informatique",
    room: "Salle B12",
    status: "EN_ATTENTE",
    hasConflict: true,
    priority: "MOYENNE",
    comment: "Demande nécessitant une vérification.",
    conflictDetails: {
      type: "Salle déjà occupée",
      linkedItem: "Examen M2 Informatique",
      linkedItemType: "EXAMEN",
      systemRecommendation:
        "La demande ne doit pas être validée automatiquement.",
      suggestedAlternative: "Décaler au créneau 14h-16h",
      priorityOrderExplanation: "EXAMEN > COURS RÉGULIER > ÉVÉNEMENT PONCTUEL",
    },
  },
  {
    id: "res-003",
    teacher: "Mme Karim",
    sessionType: "EXAMEN",
    date: IN_TWO_DAYS_KEY,
    startTime: "08:00",
    endTime: "10:00",
    cohort: "M2 Informatique",
    room: "Salle C21",
    status: "VALIDEE",
    hasConflict: false,
    priority: "HAUTE",
    comment: "Examen nécessitant une salle dédiée.",
    conflictDetails: null,
  },
  {
    id: "res-004",
    teacher: "Prof. Lemaire",
    sessionType: "TD",
    date: NEXT_WEEK_KEY,
    startTime: "09:00",
    endTime: "11:00",
    cohort: "L2 Informatique",
    room: "Salle A05",
    status: "REFUSEE",
    hasConflict: false,
    priority: "FAIBLE",
    comment: "Créneau non disponible.",
    conflictDetails: null,
  },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "EN_ATTENTE", label: "EN_ATTENTE" },
  { value: "VALIDEE", label: "VALIDEE" },
  { value: "REFUSEE", label: "REFUSEE" },
  { value: "AJUSTEE", label: "AJUSTEE" },
];

const TYPE_OPTIONS = [
  { value: "ALL", label: "Tous les types" },
  { value: "CM", label: "CM" },
  { value: "TD", label: "TD" },
  { value: "TP", label: "TP" },
  { value: "EXAMEN", label: "EXAMEN" },
];

const CONFLICT_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "with_conflict", label: "Avec conflit" },
  { value: "without_conflict", label: "Sans conflit" },
];

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDateLabel(dateString) {
  const formatted = DATE_FORMATTER.format(new Date(`${dateString}T12:00:00`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getStatusTone(status) {
  if (status === "VALIDEE") return "validated";
  if (status === "REFUSEE") return "refused";
  if (status === "AJUSTEE") return "adjusted";
  return "waiting";
}

function getPriorityTone(priority) {
  if (priority === "HAUTE") return "high";
  if (priority === "FAIBLE") return "low";
  return "medium";
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

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 9V12.5M12 16H12.01M10.29 3.86002L1.82001 18C1.64538 18.3024 1.553 18.6451 1.55206 18.9944C1.55113 19.3436 1.64167 19.6868 1.81468 19.9901C1.98769 20.2934 2.23706 20.546 2.53811 20.723C2.83916 20.8999 3.18126 20.995 3.53001 20.999L20.47 21C20.8188 20.995 21.1609 20.8999 21.4619 20.723C21.763 20.546 22.0123 20.2934 22.1853 19.9901C22.3584 19.6868 22.4489 19.3436 22.4479 18.9944C22.447 18.6451 22.3546 18.3024 22.18 18L13.71 3.86002C13.5318 3.56613 13.2819 3.32208 12.9837 3.15096C12.6855 2.97984 12.3485 2.88733 12.005 2.88232C11.6616 2.87731 11.322 2.95998 11.0188 3.12235C10.7156 3.28471 10.4587 3.52137 10.29 3.81002"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminReservations() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState(MOCK_RESERVATIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [conflictFilter, setConflictFilter] = useState("all");
  const [selectedReservation, setSelectedReservation] = useState(null);

  const filteredReservations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const matchesSearch =
        !query ||
        [reservation.teacher, reservation.cohort, reservation.room]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" || reservation.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" || reservation.sessionType === typeFilter;

      const matchesConflict =
        conflictFilter === "all" ||
        (conflictFilter === "with_conflict" && reservation.hasConflict) ||
        (conflictFilter === "without_conflict" && !reservation.hasConflict);

      return matchesSearch && matchesStatus && matchesType && matchesConflict;
    });
  }, [reservations, searchTerm, statusFilter, typeFilter, conflictFilter]);

  function handleStatusChange(reservation, nextStatus, closeModal = false) {
    const updatedReservation = {
      ...reservation,
      status: nextStatus,
    };

    setReservations((currentReservations) =>
      currentReservations.map((currentReservation) =>
        currentReservation.id === reservation.id ? updatedReservation : currentReservation
      )
    );

    if (closeModal) {
      setSelectedReservation(null);
      return;
    }

    setSelectedReservation(updatedReservation);
  }

  function handleViewConflicts(reservation) {
    setSelectedReservation(null);
    navigate(`/admin/conflits?reservation=${reservation.id}`);
  }

  return (
    <>
      <div className="admin-reservations-page">
        <div className="admin-reservations-shell">
          <header className="admin-reservations-header">
            <div className="admin-reservations-heading">
              <h1 className="admin-reservations-title">Gestion des réservations</h1>
            </div>

            <div className="admin-reservations-tools">
              <label className="admin-reservations-search">
                <SearchIcon />
                <input
                  type="search"
                  placeholder="Rechercher un enseignant, une cohorte ou une salle..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Rechercher une réservation"
                />
              </label>
            </div>
          </header>

          <div className="admin-reservations-content">
            <section className="admin-reservations-panel">
              <div className="admin-reservations-panel-top">
                <div className="admin-reservations-panel-headline">
                  <div className="admin-reservations-panel-heading">
                    <h2 className="admin-reservations-panel-title">Demandes de réservation</h2>
                  </div>
                </div>

                <div className="admin-reservations-filters" aria-label="Filtres des réservations">
                  <label className="admin-reservations-filter">
                    <span>Statut</span>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      aria-label="Filtrer par statut"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-reservations-filter">
                    <span>Type</span>
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                      aria-label="Filtrer par type"
                    >
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-reservations-filter">
                    <span>Conflit</span>
                    <select
                      value={conflictFilter}
                      onChange={(event) => setConflictFilter(event.target.value)}
                      aria-label="Filtrer par conflit"
                    >
                      {CONFLICT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {filteredReservations.length > 0 ? (
                <div className="admin-reservations-table-wrap">
                  <table className="admin-reservations-table">
                    <thead>
                      <tr>
                        <th>Enseignant</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Horaire</th>
                        <th>Cohorte</th>
                        <th>Salle</th>
                        <th>Statut</th>
                        <th>Priorité</th>
                        <th>Conflit</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredReservations.map((reservation) => (
                        <tr
                          key={reservation.id}
                          className={
                            reservation.hasConflict ? "admin-reservations-row--conflict" : ""
                          }
                        >
                          <td>
                            <div className="admin-reservations-teacher">
                              {reservation.hasConflict ? (
                                <span className="admin-reservations-conflict-icon">
                                  <WarningIcon />
                                </span>
                              ) : null}
                              <span>{reservation.teacher}</span>
                            </div>
                          </td>

                          <td>
                            <span className="admin-reservations-type-badge">
                              {reservation.sessionType}
                            </span>
                          </td>

                          <td>
                            <span className="admin-reservations-date">
                              {formatDateLabel(reservation.date)}
                            </span>
                          </td>

                          <td>
                            <span className="admin-reservations-time">
                              {reservation.startTime} - {reservation.endTime}
                            </span>
                          </td>

                          <td>{reservation.cohort}</td>
                          <td>{reservation.room}</td>

                          <td>
                            <span
                              className={`admin-reservations-status-badge admin-reservations-status-badge--${getStatusTone(
                                reservation.status
                              )}`}
                            >
                              {reservation.status}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`admin-reservations-priority-badge admin-reservations-priority-badge--${getPriorityTone(
                                reservation.priority
                              )}`}
                            >
                              {reservation.priority}
                            </span>
                          </td>

                          <td>
                            {reservation.hasConflict ? (
                              <span className="admin-reservations-conflict-badge">
                                <WarningIcon />
                                Conflit détecté
                              </span>
                            ) : (
                              <span className="admin-reservations-conflict-neutral">
                                Aucun conflit
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="admin-reservations-actions">
                              <button
                                type="button"
                                className="admin-reservations-action admin-reservations-action--details"
                                onClick={() => setSelectedReservation(reservation)}
                              >
                                Détails
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-reservations-empty">
                  Aucune réservation ne correspond aux filtres sélectionnés.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {selectedReservation ? (
        <div
          className="admin-reservations-modal-overlay"
          onClick={() => setSelectedReservation(null)}
        >
          <div
            className="admin-reservations-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-reservations-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-reservations-modal-header">
              <div className="admin-reservations-modal-heading">
                <h3
                  id="admin-reservations-modal-title"
                  className="admin-reservations-modal-title"
                >
                  Détail de la demande
                </h3>
                <p className="admin-reservations-modal-description">
                  Consulte les informations principales avant validation, ajustement ou refus.
                </p>
              </div>

              <button
                type="button"
                className="admin-reservations-modal-close"
                onClick={() => setSelectedReservation(null)}
                aria-label="Fermer"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="admin-reservations-modal-body">
              <div className="admin-reservations-modal-grid">
                <div className="admin-reservations-modal-card">
                  <span className="admin-reservations-modal-label">Enseignant</span>
                  <span className="admin-reservations-modal-value">
                    {selectedReservation.teacher}
                  </span>
                </div>

                <div className="admin-reservations-modal-card">
                  <span className="admin-reservations-modal-label">Type</span>
                  <span className="admin-reservations-modal-type">
                    {selectedReservation.sessionType}
                  </span>
                </div>

                <div className="admin-reservations-modal-card">
                  <span className="admin-reservations-modal-label">Date</span>
                  <span className="admin-reservations-modal-value">
                    {formatDateLabel(selectedReservation.date)}
                  </span>
                </div>

                <div className="admin-reservations-modal-card">
                  <span className="admin-reservations-modal-label">Horaire</span>
                  <span className="admin-reservations-modal-value">
                    {selectedReservation.startTime} - {selectedReservation.endTime}
                  </span>
                </div>

                <div className="admin-reservations-modal-card">
                  <span className="admin-reservations-modal-label">Cohorte</span>
                  <span className="admin-reservations-modal-value">
                    {selectedReservation.cohort}
                  </span>
                </div>

                <div className="admin-reservations-modal-card">
                  <span className="admin-reservations-modal-label">Salle</span>
                  <span className="admin-reservations-modal-value">
                    {selectedReservation.room}
                  </span>
                </div>

                <div className="admin-reservations-modal-card">
                  <span className="admin-reservations-modal-label">Statut</span>
                  <span
                    className={`admin-reservations-status-badge admin-reservations-status-badge--${getStatusTone(
                      selectedReservation.status
                    )}`}
                  >
                    {selectedReservation.status}
                  </span>
                </div>

                <div className="admin-reservations-modal-card">
                  <span className="admin-reservations-modal-label">Priorité</span>
                  <span
                    className={`admin-reservations-priority-badge admin-reservations-priority-badge--${getPriorityTone(
                      selectedReservation.priority
                    )}`}
                  >
                    {selectedReservation.priority}
                  </span>
                </div>
              </div>

              {selectedReservation.hasConflict && selectedReservation.conflictDetails ? (
                <section className="admin-reservations-modal-conflict">
                  <div className="admin-reservations-modal-conflict-header">
                    <span className="admin-reservations-modal-conflict-icon">
                      <WarningIcon />
                    </span>

                    <div className="admin-reservations-modal-conflict-heading">
                      <h4 className="admin-reservations-modal-conflict-title">
                        Résumé du conflit
                      </h4>
                      <p className="admin-reservations-modal-conflict-text">
                        Cette demande nécessite une vérification complémentaire.
                      </p>
                    </div>
                  </div>

                  <div className="admin-reservations-modal-conflict-grid">
                    <div className="admin-reservations-modal-conflict-card">
                      <span className="admin-reservations-modal-label">Type de conflit</span>
                      <span className="admin-reservations-modal-value">
                        {selectedReservation.conflictDetails.type}
                      </span>
                    </div>

                    <div className="admin-reservations-modal-conflict-card">
                      <span className="admin-reservations-modal-label">Élément en conflit</span>
                      <span className="admin-reservations-modal-value">
                        {selectedReservation.conflictDetails.linkedItem}
                      </span>
                    </div>

                    <div className="admin-reservations-modal-conflict-card">
                      <span className="admin-reservations-modal-label">Type concerné</span>
                      <span className="admin-reservations-modal-value">
                        {selectedReservation.conflictDetails.linkedItemType}
                      </span>
                    </div>

                    <div className="admin-reservations-modal-conflict-card">
                      <span className="admin-reservations-modal-label">Ordre de priorité</span>
                      <span className="admin-reservations-modal-value">
                        {selectedReservation.conflictDetails.priorityOrderExplanation}
                      </span>
                    </div>

                    <div className="admin-reservations-modal-conflict-card admin-reservations-modal-conflict-card--wide">
                      <span className="admin-reservations-modal-label">
                        Recommandation du système
                      </span>
                      <span className="admin-reservations-modal-value">
                        {selectedReservation.conflictDetails.systemRecommendation}
                      </span>
                    </div>

                    <div className="admin-reservations-modal-conflict-card admin-reservations-modal-conflict-card--wide">
                      <span className="admin-reservations-modal-label">
                        Alternative proposée
                      </span>
                      <span className="admin-reservations-modal-value">
                        {selectedReservation.conflictDetails.suggestedAlternative}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="admin-reservations-conflict-link"
                    onClick={() => handleViewConflicts(selectedReservation)}
                  >
                    Voir dans Conflits
                  </button>
                </section>
              ) : null}
            </div>

            <div className="admin-reservations-modal-footer">
              <button
                type="button"
                className="admin-reservations-modal-action admin-reservations-modal-action--validate"
                onClick={() => handleStatusChange(selectedReservation, "VALIDEE", true)}
                disabled={selectedReservation.hasConflict}
                title={
                  selectedReservation.hasConflict
                    ? "Validation directe désactivée en cas de conflit"
                    : "Valider la demande"
                }
              >
                Valider
              </button>

              <button
                type="button"
                className="admin-reservations-modal-action admin-reservations-modal-action--adjust"
                onClick={() => handleStatusChange(selectedReservation, "AJUSTEE", true)}
              >
                Ajuster
              </button>

              <button
                type="button"
                className="admin-reservations-modal-action admin-reservations-modal-action--refuse"
                onClick={() => handleStatusChange(selectedReservation, "REFUSEE", true)}
              >
                Refuser
              </button>

              <button
                type="button"
                className="admin-reservations-modal-action admin-reservations-modal-action--ghost"
                onClick={() => setSelectedReservation(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
