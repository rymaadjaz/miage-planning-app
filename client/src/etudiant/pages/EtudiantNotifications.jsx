import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import { getNotifications, markNotificationAsRead } from '../../services/api';
import '../../styles/enseignant.css';
import '../../styles/etudiant.css';

const ICON_MAP = {
  location: { icon: '📍', cls: 'location' },
  check: { icon: '✔', cls: 'check' },
  info: { icon: 'ℹ', cls: 'info' },
  warning: { icon: '⚠', cls: 'warning' },
};

export default function EtudiantNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      setLoading(true);
      setApiError('');
      try {
        const rows = await getNotifications({ role: 'etudiant' });
        if (isMounted) setItems(rows);
      } catch (error) {
        if (isMounted) {
          setItems([]);
          setApiError(error.message || "Impossible de charger les notifications depuis l'API.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  const unread = items.filter((n) => n.status !== 'lu');
  const unreadCount = unread.length;

  async function handleMarkOneAsRead(noteId) {
    try {
      await markNotificationAsRead(noteId);
      setItems((prev) => prev.filter((n) => String(n.id) !== String(noteId)));
    } catch (error) {
      setApiError(error.message || "Impossible de marquer la notification comme vue.");
    }
  }

  async function markAllRead() {
    try {
      await Promise.all(unread.map((note) => markNotificationAsRead(note.id)));
      setItems((prev) => prev.filter((n) => n.status === 'lu'));
    } catch (error) {
      setApiError(error.message || "Impossible de marquer toutes les notifications comme vues.");
    }
  }

  return (
    <div className="ens-page etu-notif-page">
      <Navbar notifCount={unreadCount} onNotifications={() => {}} />

      <div className="ens-content etu-notif-content">
        <div className="ens-card">
          <div className="etu-notif-header">
            <div className="etu-notif-title-block">
              <h2>Notifications</h2>
              <p>
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </p>
            </div>
            <BackButton label="Retour au calendrier" to="/etudiant" fallback="/etudiant" />
          </div>

          <div className="etu-notif-tabs-row">
            <div className="ens-notif-state">Notifications a consulter</div>
            <button className="ens-btn-outline etu-notif-read-all" onClick={markAllRead}>
              Tout valider (vu)
            </button>
          </div>

          <div className="etu-divider" />

          {loading && <div style={{ padding: '12px 0' }}>Chargement des notifications...</div>}
          {!loading && apiError && <div style={{ padding: '12px 0', color: '#b42318' }}>Erreur API: {apiError}</div>}

          {unread.length === 0 ? (
            <div className="ens-empty">
              <div className="ens-empty-icon">🔔</div>
              <h3>Aucune notification</h3>
              <p>Vous etes a jour !</p>
            </div>
          ) : (
            <div className="notif-list">
              {unread.map((note, idx) => {
                const iconMeta = ICON_MAP[note.iconType] || ICON_MAP.info;
                const isNew = note.status === 'nouveau';

                return (
                  <div key={note.id}>
                    <div className="notif-item unread">
                      <div className={`notif-icon-wrap ${iconMeta.cls}`}>{iconMeta.icon}</div>
                      <div className="notif-body">
                        <div className="notif-top">
                          <span className="notif-title-text">{note.titre}</span>
                          {isNew && <span className="badge badge-nouveau">Nouveau</span>}
                        </div>
                        <p>{note.message}</p>
                        <div className="notif-time">{note.date}</div>
                        <div className="notif-actions">
                          <button
                            type="button"
                            className="notif-read-btn"
                            onClick={() => handleMarkOneAsRead(note.id)}
                          >
                            J'ai vu
                          </button>
                        </div>
                      </div>
                    </div>
                    {idx < unread.length - 1 && <div className="notif-divider" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
