import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import { getDemandes } from '../../services/api';
import '../../styles/enseignant.css';

const STATUT_META = {
  validee:      { cls: 'badge-validee', label: 'VALIDÉE'    },
  validated:    { cls: 'badge-validee', label: 'VALIDÉE'    },
  'en attente': { cls: 'badge-attente', label: 'EN ATTENTE' },
  refusee:      { cls: 'badge-refuse',  label: 'REFUSÉE'    },
  ajustee:      { cls: 'badge-ajuste',  label: 'AJUSTÉE'    },
};

const normalise = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function StatIcon({ type }) {
  const MAP = {
    total:   { bg: '#1e293b', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>)},
    validee: { bg: '#22c17a', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>)},
    attente: { bg: '#f59e0b', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>)},
    ajuste:  { bg: '#3b7cf4', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>)},
    refuse:  { bg: '#ef4444', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>)},
  };
  const { bg, icon } = MAP[type] ?? MAP.total;
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      {icon}
    </div>
  );
}

export default function EnseignantDemandes() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDemandes() {
      setLoading(true);
      setApiError('');
      try {
        const rows = await getDemandes();
        if (isMounted) setDemandes(rows);
      } catch (error) {
        if (isMounted) {
          setDemandes([]);
          setApiError(error.message || "Impossible de charger les demandes depuis l'API.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDemandes();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => (
    demandes.reduce((acc, d) => {
      acc.total++;
      const k = normalise(d.statut);
      if (k.includes('valid')) acc.validee++;
      else if (k.includes('attente')) acc.attente++;
      else if (k.includes('refus')) acc.refuse++;
      else if (k.includes('ajust')) acc.ajuste++;
      return acc;
    }, { total: 0, validee: 0, attente: 0, refuse: 0, ajuste: 0 })
  ), [demandes]);

  const STAT_DEFS = [
    { key: 'total',   label: 'Total',      type: 'total'  },
    { key: 'validee', label: 'Validées',   type: 'validee'},
    { key: 'attente', label: 'En attente', type: 'attente'},
    { key: 'ajuste',  label: 'Ajustées',   type: 'ajuste' },
    { key: 'refuse',  label: 'Refusées',   type: 'refuse' },
  ];

  const handleSupprimer = id => {
    if (window.confirm('Supprimer cette demande ?'))
      setDemandes(ds => ds.filter(d => d.id !== id));
  };

  const filtered = useMemo(() => {
    const query = normalise(search.trim());
    if (!query) return demandes;

    return demandes.filter((d) => {
      const haystack = normalise([d.type, d.date, d.cohorte, d.salle, d.statut, d.demandeType].join(' '));
      return haystack.includes(query);
    });
  }, [demandes, search]);

  const formatDate = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const timeAgo = d => {
    if (!d.createdAt) return 'Il y a 1 jour';
    const diff = Date.now() - new Date(d.createdAt).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Aujourd'hui";
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  };

  const validatedBy = d => {
    const k = normalise(d.statut);
    if (k.includes('valid')) return <span style={{ fontSize: '.75rem', color: '#7a8eaa' }}>Validé par admin</span>;
    if (k.includes('ajust')) return <span style={{ fontSize: '.75rem', color: '#7a8eaa' }}>Modifié par admin</span>;
    if (k.includes('refus')) return <span style={{ fontSize: '.75rem', color: '#7a8eaa' }}>Refusé</span>;
    return null;
  };

  const demandeTypeLabel = (d) => d.demandeType === 'DEPLACEMENT' ? 'Déplacement demandé' : 'Nouvelle réservation';

  return (
    <div className="ens-page">
      <Navbar />

      <div className="ens-content">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, marginBottom: 20
        }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-.02em' }}>
            Mes demandes de réservation
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BackButton label="Retour au calendrier" to="/calendar" />
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7a8eaa', pointerEvents: 'none' }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '8px 12px 8px 34px',
                  border: '1.5px solid #e0e7f3', borderRadius: 8,
                  fontFamily: 'inherit', fontSize: '.875rem',
                  color: '#1a2b45', background: '#fff', outline: 'none',
                  width: 220, transition: 'border-color .15s'
                }}
              />
            </div>
            <button style={{
              width: 36, height: 36, borderRadius: 8,
              border: '1.5px solid #e0e7f3', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#7a8eaa', position: 'relative'
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span style={{
                position: 'absolute', top: 5, right: 5,
                width: 8, height: 8, borderRadius: '50%',
                background: '#f59e0b', border: '2px solid #fff'
              }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="ens-btn" style={{ gap: 8 }} onClick={() => navigate('/enseignant/demandes/nouvelle-reservation')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvelle demande
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {STAT_DEFS.map(({ key, label, type }) => (
            <div key={key} style={{
              flex: 1, minWidth: 120,
              background: '#fff', border: '1.5px solid #e0e7f3',
              borderRadius: 12, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 1px 6px rgba(15,35,66,.05)'
            }}>
              <StatIcon type={type} />
              <div>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#7a8eaa', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1a2b45', lineHeight: 1 }}>
                  {stats[key]}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="ens-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading && <div style={{ padding: '16px 20px' }}>Chargement des demandes depuis l'API...</div>}
          {!loading && apiError && <div style={{ padding: '16px 20px', color: '#b42318' }}>Erreur API: {apiError}</div>}

          <div style={{ padding: '18px 20px 12px', fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid #f0f3fa' }}>
            Mes demandes
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a8eaa' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>📭</div>
              <p style={{ fontWeight: 700, color: '#1a2b45' }}>Aucune demande trouvée</p>
            </div>
          ) : (
            <table className="ens-table">
              <thead>
                <tr>
                  {['Type','Date','Horaire','Cohorte','Salle','Statut','Créée','Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const meta = STATUT_META[normalise(d.statut)] ?? { cls: 'badge-attente', label: d.statut?.toUpperCase() };
                  const isValidee = normalise(d.statut).includes('valid');
                  return (
                    <tr key={d.id}>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px',
                          borderRadius: 4, fontSize: '.78rem', fontWeight: 700,
                          background: '#f0f4fb', color: '#1a2b45'
                        }}>
                          {d.type}
                        </span>
                        <div style={{ marginTop: 4, fontSize: '.74rem', color: '#7a8eaa', fontWeight: 600 }}>
                          {demandeTypeLabel(d)}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {formatDate(d.date)}
                      </td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '.83rem', color: '#3b7cf4' }}>
                        {d.debut} - {d.fin}
                      </td>
                      <td>{d.cohorte}</td>
                      <td>{d.salle}</td>
                      <td>
                        <span className={`badge ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '.78rem', color: '#7a8eaa' }}>{timeAgo(d)}</div>
                        <div style={{ marginTop: 2 }}>{validatedBy(d)}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isValidee && (
                            <button
                              className="ens-btn-ghost"
                              style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 700, padding: '4px 8px' }}
                              onClick={() => navigate('/enseignant/demandes/nouvelle-reservation', {
                                state: { mode: 'DEPLACEMENT', sourceReservation: d },
                              })}
                            >
                              Déplacer
                            </button>
                          )}
                          <button
                            className="ens-btn-ghost"
                            style={{ fontSize: '.82rem', color: '#ef4444', fontWeight: 700, padding: '4px 8px' }}
                            onClick={() => handleSupprimer(d.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}