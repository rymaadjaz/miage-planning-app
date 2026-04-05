import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDemandes, request } from "../../services/api";
import "../styles/AdminReservations.css";
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
  if (!dateString) return "-";
  try {
    const formatted = DATE_FORMATTER.format(new Date(`${dateString}T12:00:00`));
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return dateString;
  }
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

// Composants Icônes
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 9V12.5M12 16H12.01M10.29 3.86002L1.82001 18C1.64538 18.3024 1.553 18.6451 1.55206 18.9944C1.55113 19.3436 1.64167 19.6868 1.81468 19.9901C1.98769 20.2934 2.23706 20.546 2.53811 20.723C2.83916 20.8999 3.18126 20.995 3.53001 20.999L20.47 21C20.8188 20.995 21.1609 20.8999 21.4619 20.723C21.763 20.546 22.0123 20.2934 22.1853 19.9901C22.3584 19.6868 22.4489 19.3436 22.4479 18.9944C22.447 18.6451 22.3546 18.3024 22.18 18L13.71 3.86002C13.5318 3.56613 13.2819 3.32208 12.9837 3.15096C12.6855 2.97984 12.3485 2.88733 12.005 2.88232C11.6616 2.87731 11.322 2.95998 11.0188 3.12235C10.7156 3.28471 10.4587 3.52137 10.29 3.81002" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminReservations() {
  const navigate = useNavigate();  
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [conflictFilter, setConflictFilter] = useState("all");
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchReservations() {
      try {
        setLoading(true);
        const data = await getDemandes(); // Appel à ton backend via api.js
        if (isMounted) {
          // On transforme les données du backend pour coller au design du composant
          const formattedData = data.map((d) => {
            // Conversion du statut front vers le statut interne attendu
            let internalStatus = "EN_ATTENTE";
            if (d.statut === "VALIDÉE") internalStatus = "VALIDEE";
            if (d.statut === "REFUSÉE") internalStatus = "REFUSEE";
            if (d.statut === "AJUSTÉE") internalStatus = "AJUSTEE";
            if (d.statut === "EN ATTENTE") internalStatus = "EN_ATTENTE";

            return {
              id: d.id,
              teacher: d.enseignant || "Inconnu",
              sessionType: d.type || "CM",
              date: d.date,
              startTime: d.debut,
              endTime: d.fin,
              cohort: d.cohorte || "-",
              room: d.salle || "-",
              status: internalStatus,
              hasConflict: false, // A implémenter plus tard si ton API renvoie les conflits
              priority: "MOYENNE", 
              comment: d.motif || "Aucun commentaire",
              conflictDetails: null, 
            };
          });
          
          setReservations(formattedData);
        }
      } catch (err) {
        if (isMounted) setError("Impossible de charger les réservations.");
        console.error("Erreur API:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReservations();

    return () => {
      isMounted = false;
    };
  }, []);

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

  async function handleStatusChange(reservation, nextStatus, closeModal = false) {
    // 1. On sauvegarde temporairement l'ancien statut en cas d'erreur
    const oldStatus = reservation.status;

    // 2. On met à jour l'affichage immédiatement (pour la fluidité)
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
    } else {
      setSelectedReservation(updatedReservation);
    }

    try {
      // 3. On détermine quelle route API appeler selon l'action
      let apiRoute = '';
      let method = 'PUT'; // ou PATCH selon ton backend
      let bodyData = {};

      if (nextStatus === 'VALIDEE') {
        // Option A : Ton backend a une route spécifique pour valider
        // apiRoute = `/api/reservations/${reservation.id}/validate`; 
        
        // Option B : Ton backend utilise une mise à jour générale
        apiRoute = `/api/reservations/${reservation.id}`;
        bodyData = { statut: 'VALIDEE' };
      } 
      else if (nextStatus === 'REFUSEE') {
        // C'est la route "cancel" que tu as déjà utilisée côté enseignant !
        apiRoute = `/api/reservations/${reservation.id}/cancel`;
        method = 'PATCH'; 
      }
      else if (nextStatus === 'AJUSTEE') {
         apiRoute = `/api/reservations/${reservation.id}`;
         bodyData = { statut: 'AJUSTEE' };
      }

      // 4. On envoie la requête au serveur
      await request(apiRoute, {
        method: method,
        data: method === 'PUT' ? bodyData : undefined,
        auth: true
      });

      console.log(`Réservation ${reservation.id} mise à jour avec le statut ${nextStatus}`);

    } catch (error) {
      // 5. En cas d'erreur (ex: problème serveur), on annule le changement visuel
      console.error("Erreur lors du changement de statut:", error);
      alert("Erreur de connexion : Impossible de modifier le statut dans la base de données.");
      
      setReservations((currentReservations) =>
        currentReservations.map((currentReservation) =>
          currentReservation.id === reservation.id ? { ...currentReservation, status: oldStatus } : currentReservation
        )
      );
      if (!closeModal) {
          setSelectedReservation({ ...reservation, status: oldStatus });
      }
    }
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

              {/* Gestion de l'affichage du chargement et des erreurs */}
              {loading ? (
                <div className="admin-reservations-empty">Chargement des réservations depuis le serveur...</div>
              ) : error ? (
                <div className="admin-reservations-empty" style={{ color: "red" }}>{error}</div>
              ) : filteredReservations.length > 0 ? (
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
                          className={reservation.hasConflict ? "admin-reservations-row--conflict" : ""}
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