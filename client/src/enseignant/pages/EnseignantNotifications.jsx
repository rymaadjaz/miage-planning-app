import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import { getNotifications } from '../../services/api';
import '../../styles/enseignant.css';

const TABS = ['Toutes', 'Non lues', 'Importantes'];

const ICON_MAP = {
  location: { icon: '📍', cls: 'location' },
  check:    { icon: '✔',  cls: 'check' },
  info:     { icon: 'ℹ',  cls: 'info' },
  warning:  { icon: '⚠',  cls: 'warning' },
};

export default function EnseignantNotifications() {
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
        const rows = await getNotifications({ role: 'enseignant' });
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

  const unreadCount     = items.filter(n => n.status !== 'lu').length;
  const importantCount  = items.filter(n => n.status === 'important').length;

  const tabCount = { 'Toutes': items.length, 'Non lues': unreadCount, 'Importantes': importantCount };

  const filtered = items.filter(n => {
    if (activeTab === 'Non lues')   return n.status !== 'lu';
    if (activeTab === 'Importantes') return n.status === 'important';
    return true;
  });

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, status: 'lu' })));

  return (
    <div className="ens-page">
      <Navbar />

      <div className="ens-content" style={{ maxWidth: 680 }}>
        <div className="ens-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem' }}>Notifications</h2>
              <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: 2 }}>
                {unreadCount} non lue{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <BackButton label="Retour au calendrier" to="/calendar" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 10 }}>
            <div className="ens-tabs">
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={activeTab === tab ? 'active' : ''}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  {tabCount[tab] > 0 && (
                    <span className="tab-count">{tabCount[tab]}</span>
                  )}
                </button>
              ))}
            </div>
            <button className="ens-btn-outline" style={{ fontSize: '.82rem' }} onClick={markAllRead}>
              Marquer toutes comme lues
            </button>
          </div>

          <div className="ens-divider" />

          {loading && <div style={{ padding: '12px 0' }}>Chargement des notifications...</div>}
          {!loading && apiError && <div style={{ padding: '12px 0', color: '#b42318' }}>Erreur API: {apiError}</div>}

          {filtered.length === 0 ? (
            <div className="ens-empty">
              <div className="ens-empty-icon">🔔</div>
              <h3>Aucune notification</h3>
              <p>Vous êtes à jour !</p>
            </div>
          ) : (
            <div className="notif-list">
              {filtered.map((note, idx) => {
                const iconMeta = ICON_MAP[note.iconType] ?? ICON_MAP.info;
                const isUnread = note.status !== 'lu';
                const isNew    = note.status === 'nouveau';
                const isImp    = note.status === 'important';

                return (
                  <div key={note.id}>
                    <div className={`notif-item ${isUnread ? 'unread' : ''}`}>
                      <div className={`notif-icon-wrap ${iconMeta.cls}`}>
                        {iconMeta.icon}
                      </div>
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