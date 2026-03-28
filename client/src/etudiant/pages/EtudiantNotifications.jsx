import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import { getNotifications } from '../../services/api';
import '../../styles/enseignant.css';
import '../../styles/etudiant.css';

const TABS = ['Toutes', 'Non lues', 'Importantes'];

const ICON_MAP = {
  location: { icon: '📍', cls: 'location' },
  check: { icon: '✔', cls: 'check' },
  info: { icon: 'ℹ', cls: 'info' },
  warning: { icon: '⚠', cls: 'warning' },
};

export default function EtudiantNotifications() {
  const [activeTab, setActiveTab] = useState('Toutes');
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

  const unreadCount = items.filter((n) => n.status !== 'lu').length;
  const importantCount = items.filter((n) => n.status === 'important').length;

  const tabCount = {
    Toutes: items.length,
    'Non lues': unreadCount,
    Importantes: importantCount,
  };

  const filtered = items.filter((n) => {
    if (activeTab === 'Non lues') return n.status !== 'lu';
    if (activeTab === 'Importantes') return n.status === 'important';
    return true;
  });

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, status: 'lu' })));
  };

  return (
    <div className="ens-page">
      <Navbar onNotifications={() => {}} />

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
            <div className="ens-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={activeTab === tab ? 'active' : ''}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  {tabCount[tab] > 0 && <span className="tab-count">{tabCount[tab]}</span>}
                </button>
              ))}
            </div>
            <button className="ens-btn-outline etu-notif-read-all" onClick={markAllRead}>
              Marquer toutes comme lues
            </button>
          </div>

          <div className="etu-divider" />

          {loading && <div style={{ padding: '12px 0' }}>Chargement des notifications...</div>}
          {!loading && apiError && <div style={{ padding: '12px 0', color: '#b42318' }}>Erreur API: {apiError}</div>}

          {filtered.length === 0 ? (
            <div className="ens-empty">
              <div className="ens-empty-icon">🔔</div>
              <h3>Aucune notification</h3>
              <p>Vous etes a jour !</p>
            </div>
          ) : (
            <div className="notif-list">
              {filtered.map((note, idx) => {
                const iconMeta = ICON_MAP[note.iconType] || ICON_MAP.info;
                const isUnread = note.status !== 'lu';
                const isNew = note.status === 'nouveau';
                const isImp = note.status === 'important';

                return (
                  <div key={note.id}>
                    <div className={`notif-item ${isUnread ? 'unread' : ''}`}>
                      <div className={`notif-icon-wrap ${iconMeta.cls}`}>{iconMeta.icon}</div>
                      <div className="notif-body">
                        <div className="notif-top">
                          <span className="notif-title-text">{note.titre}</span>
                          {isNew && <span className="badge badge-nouveau">Nouveau</span>}
                          {isImp && <span className="badge badge-important">Important</span>}
                        </div>
                        <p>{note.message}</p>
                        <div className="notif-time">{note.date}</div>
                      </div>
                    </div>
                    {idx < filtered.length - 1 && <div className="notif-divider" />}
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
