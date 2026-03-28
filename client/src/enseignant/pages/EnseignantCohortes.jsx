import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import { getCohortes } from '../../services/api';
import '../../styles/enseignant.css';

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IconAward = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

const IconGroupSummary = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

function MetaRow({ icon, iconBg, iconColor, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{
        width: 40, height: 40,
        borderRadius: 10,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: iconColor,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)' }}>
          {label}
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function CohorteCard({ groupe, filiere, onOpen }) {
  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #e4eaf4',
      borderRadius: 14,
      padding: '20px 20px 18px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 6px rgba(15,35,66,.06)',
      transition: 'box-shadow .2s, border-color .2s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,79,158,.13)'; e.currentTarget.style.borderColor = '#b8cef5'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(15,35,66,.06)'; e.currentTarget.style.borderColor = '#e4eaf4'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: groupe.color, flexShrink: 0 }} />
        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          {groupe.nom}
        </h4>
      </div>

      <p style={{ fontSize: '.83rem', color: 'var(--muted)', marginBottom: 18, lineHeight: 1.45 }}>
        {groupe.description}
      </p>

      <MetaRow
        icon={<IconUsers />}
        iconBg="#e8f0fd" iconColor="#1a4f9e"
        label="Étudiants"
        value={groupe.etudiants}
      />
      <MetaRow
        icon={<IconBook />}
        iconBg="#e6f8ee" iconColor="#14845a"
        label="Cours"
        value={`${groupe.cours} cours`}
      />
      <MetaRow
        icon={<IconAward />}
        iconBg="#fff5e2" iconColor="#a06700"
        label="Niveau"
        value={groupe.niveau}
      />

      <button
        onClick={() => onOpen(groupe, filiere)}
        style={{
          marginTop: 8,
          width: '100%',
          padding: '11px 0',
          background: '#0f2342',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontFamily: 'inherit',
          fontSize: '.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#162d52'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#0f2342'; }}
      >
        Voir l'emploi du temps
      </button>
    </div>
  );
}

export default function EnseignantCohortes() {
  const navigate = useNavigate();
  const [cohortes, setCohortes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadCohortes() {
      setLoading(true);
      setApiError('');
      try {
        const rows = await getCohortes();
        if (isMounted) setCohortes(rows);
      } catch (error) {
        if (isMounted) {
          setCohortes([]);
          setApiError(error.message || "Impossible de charger les cohortes depuis l'API.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCohortes();
    return () => {
      isMounted = false;
    };
  }, []);

  const filieres = useMemo(() => {
    const groupes = cohortes.map((c, index) => ({
      id: String(c.id),
      nom: c.nom,
      description: c.niveau ? `Niveau ${c.niveau}` : 'Cohorte API',
      etudiants: c.effectif ?? 0,
      cours: 0,
      niveau: c.niveau || 'N/A',
      color: ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#14b8a6'][index % 5],
    }));

    return [{
      id: 'api-cohortes',
      nom: 'Cohortes',
      niveau: 'API',
      icon: '🎓',
      groupes,
    }];
  }, [cohortes]);

  const summary = useMemo(() => ({
    filieres: filieres.length,
    groupes: filieres.reduce((n, f) => n + (f.groupes?.length ?? 0), 0),
  }), [filieres]);

  const handleOpen = (groupe, filiere) => {
    navigate(`/etudiant?group=${encodeURIComponent(groupe.id)}`, {
      state: {
        fromEnseignant: true,
        groupId: groupe.id,
        groupName: groupe.nom,
        groupDescription: groupe.description,
        groupInitial: (groupe.nom || 'G').charAt(0).toUpperCase(),
        filiereName: filiere.nom,
      },
    });
  };

  return (
    <div className="ens-page">
      <Navbar />

      <div className="ens-content">
        {loading && <div className="ens-card" style={{ marginBottom: 12 }}>Chargement des cohortes depuis l'API...</div>}
        {!loading && apiError && <div className="ens-card" style={{ marginBottom: 12, color: '#b42318' }}>Erreur API: {apiError}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <BackButton label="Retour au calendrier" to="/calendar" />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          background: '#fff',
          border: '1.5px solid #e4eaf4',
          borderRadius: 14,
          padding: '16px 22px',
          marginBottom: 28,
          boxShadow: '0 1px 6px rgba(15,35,66,.06)',
        }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: 14,
            background: '#0f2342',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconGroupSummary />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
              Année universitaire 2025-2026
            </div>
            <div style={{ fontSize: '.88rem', color: 'var(--muted)', marginTop: 3 }}>
              {summary.filieres} filières • {summary.groupes} groupes
            </div>
          </div>
        </div>

        {filieres.map(filiere => (
          <section key={filiere.id} style={{ marginBottom: 36 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 38, height: 38,
                borderRadius: 10,
                background: '#eef4ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
                flexShrink: 0,
              }}>
                {filiere.icon}
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  {filiere.nom}
                </h2>
                <p style={{ fontSize: '.82rem', color: 'var(--muted)', margin: 0, marginTop: 2 }}>
                  {filiere.niveau} • {filiere.groupes?.length ?? 0} groupes
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {(filiere.groupes ?? []).map(groupe => (
                <CohorteCard key={groupe.id} groupe={groupe} filiere={filiere} onOpen={handleOpen} />
              ))}
            </div>
          </section>
        ))}
        
      </div>
    </div>
  );
}