import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getEtudiantCours } from '../../services/api';
import '../../styles/enseignant.css';
import '../../styles/etudiant.css';

const VIEW_OPTIONS = ['Jour', 'Semaine', 'Mois'];
const HOURS = Array.from({ length: 9 }, (_, i) => i + 8);
const DAYS_FR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const TYPE_COLORS = { CM: 'cm', TD: 'td', TP: 'tp', EXAM: 'exam', Examen: 'exam' };

const LEGEND = [
  { label: 'CM', color: '#3b7cf4' },
  { label: 'TD', color: '#22c17a' },
  { label: 'TP', color: '#f59e0b' },
  { label: 'Examen', color: '#ef4444' },
];

const TYPE_SELECT_MAP = {
  'Tous les type': 'Tous',
  'Cours Magistral': 'CM',
  'Travaux Diriges': 'TD',
  'Travaux Pratiques': 'TP',
  Examen: 'EXAM',
};

function getWeekDays(date) {
  const d = new Date(date);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

function getMonthMatrix(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const offset = (first.getDay() + 6) % 7;
  const total = Math.ceil((offset + last.getDate()) / 7) * 7;

  const cells = Array.from({ length: total }, (_, i) => {
    const d = new Date(first);
    d.setDate(i - offset + 1);
    return d;
  });

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function formatViewLabel(currentDate, view, days) {
  if (view === 'Jour') {
    return currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (view === 'Semaine') {
    return `Semaine du ${days[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  if (view === 'Mois') {
    return `Mois de ${currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
  }
  return '';
}

function isSameDay(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function isToday(d) {
  return isSameDay(d, new Date());
}

function getHourNumber(cours) {
  if (cours?.debut) return Number(String(cours.debut).split(':')[0]);
  if (cours?.heureDebut !== undefined) return Number(cours.heureDebut);
  return 0;
}

export default function EtudiantPage() {
  const navigate = useNavigate();
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('Semaine');
  const [activeType, setActiveType] = useState('Tous');
  const [typeFilterLabel, setTypeFilterLabel] = useState('Tous les type');
  const [ensFilter, setEnsFilter] = useState('Tous les enseignants');

  useEffect(() => {
    let isMounted = true;

    async function loadCours() {
      setLoading(true);
      setApiError('');
      try {
        const rows = await getEtudiantCours();
        if (isMounted) setCours(rows);
      } catch (error) {
        if (isMounted) {
          setCours([]);
          setApiError(error.message || "Impossible de charger les cours depuis l'API.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCours();
    return () => {
      isMounted = false;
    };
  }, []);

  const enseignants = useMemo(() => {
    const names = Array.from(new Set(cours.map((c) => (c.enseignant || '').trim()).filter(Boolean)));
    return ['Tous les enseignants', ...names];
  }, [cours]);

  const weekDays = useMemo(() => {
    if (view === 'Jour') return [new Date(currentDate)];
    return getWeekDays(currentDate);
  }, [currentDate, view]);

  const monthWeeks = useMemo(() => getMonthMatrix(currentDate), [currentDate]);

  const goToPrev = () => {
    const d = new Date(currentDate);
    if (view === 'Jour') d.setDate(d.getDate() - 1);
    else if (view === 'Mois') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const goToNext = () => {
    const d = new Date(currentDate);
    if (view === 'Jour') d.setDate(d.getDate() + 1);
    else if (view === 'Mois') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const filteredCours = useMemo(() => {
    const selectType = TYPE_SELECT_MAP[typeFilterLabel] || 'Tous';
    return cours.filter((c) => {
      const legendTypeOk = activeType === 'Tous' || c.type === activeType;
      const selectTypeOk = selectType === 'Tous' || c.type === selectType;
      const ensOk = ensFilter === 'Tous les enseignants' || (c.enseignant || '').trim() === ensFilter;
      const dayIndex = (new Date(currentDate).getDay() + 6) % 7;
      const dayOk = view !== 'Jour'
        || (c.date ? isSameDay(new Date(c.date), currentDate) : c.jour === dayIndex);
      return legendTypeOk && selectTypeOk && ensOk && dayOk;
    });
  }, [activeType, typeFilterLabel, ensFilter, currentDate, view, cours]);

  const getCoursForDayHour = (dayDate, hour) =>
    filteredCours.filter((c) => {
      if (c.date && c.debut) {
        return isSameDay(new Date(c.date), dayDate) && Number(c.debut.split(':')[0]) === hour;
      }
      if (typeof c.jour === 'number') {
        return c.jour === (dayDate.getDay() + 6) % 7 && c.heureDebut === hour;
      }
      return false;
    });

  const getCoursForDate = (dayDate) =>
    filteredCours
      .filter(c => {
        if (c.date && c.debut) return isSameDay(new Date(c.date), dayDate);
        if (typeof c.jour === 'number') return c.jour === (dayDate.getDay() + 6) % 7;
        return false;
      })
      .sort((a, b) => getHourNumber(a) - getHourNumber(b));

  const exportCsv = () => {
    if (!filteredCours.length) {
      alert('Aucun cours a exporter.');
      return;
    }

    const csvRows = [
      ['id', 'matiere', 'salle', 'date', 'debut', 'fin', 'type', 'enseignant'],
      ...filteredCours.map((c) => [
        c.id,
        c.matiere,
        c.salle,
        c.date || '',
        c.debut || (c.heureDebut !== undefined ? `${String(c.heureDebut).padStart(2, '0')}:00` : ''),
        c.fin || (c.heureFin !== undefined ? `${String(c.heureFin).padStart(2, '0')}:00` : ''),
        c.type,
        c.enseignant || '',
      ]),
    ];

    const csvContent = csvRows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `emploi_du_temps_etudiant_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ens-page">
      <Navbar
        onExport={exportCsv}
        onNotifications={() => navigate('/etudiant/notifications')}
      />

      <div className="ens-content">
        {loading && <div className="ens-card" style={{ marginBottom: 12 }}>Chargement des cours depuis l'API...</div>}
        {!loading && apiError && (
          <div className="ens-card" style={{ marginBottom: 12, color: '#b42318' }}>
            Erreur API: {apiError}
          </div>
        )}

        <div className="cal-toolbar">
          <div className="cal-toolbar-left">
            <button className="ens-today-btn" onClick={() => setCurrentDate(new Date())}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Aujourd'hui
            </button>
            <button className="ens-nav-btn" onClick={goToPrev}>‹</button>
            <span className="cal-toolbar-label">
              {formatViewLabel(currentDate, view, weekDays)}
            </span>
            <button className="ens-nav-btn" onClick={goToNext}>›</button>
          </div>

          <div className="ens-toggle-group">
            {VIEW_OPTIONS.map((opt) => (
              <button key={opt} className={view === opt ? 'active' : ''} onClick={() => setView(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="cal-block">
          <div className="cal-block-head">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.2" strokeLinecap="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="cal-block-title">
              Filtres
            </span>
          </div>
          <div className="cal-actions-row">
            <select className="ens-btn-outline etu-select etu-select-type" value={typeFilterLabel} onChange={(e) => setTypeFilterLabel(e.target.value)}>
              <option>Tous les type</option>
              <option>Cours Magistral</option>
              <option>Travaux Diriges</option>
              <option>Travaux Pratiques</option>
              <option>Examen</option>
            </select>

            <select className="ens-btn-outline etu-select etu-select-ens" value={ensFilter} onChange={(e) => setEnsFilter(e.target.value)}>
              {enseignants.map((ens) => (
                <option key={ens}>{ens}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="cal-legend-row">
          {LEGEND.map(({ label, color }) => (
            <button
              key={label}
              onClick={() => setActiveType(activeType === label ? 'Tous' : label)}
              className={`cal-legend-btn ${activeType === label ? 'active' : ''}`}
            >
              <span className="cal-legend-dot" style={{ background: color }} />
              {label}
            </button>
          ))}
        </div>

        <div className="ens-card cal-grid-card">
          {view === 'Semaine' && (
            <div className="ens-calendar-wrapper">
              <table className="ens-calendar">
              <thead>
                <tr>
                  <th style={{ width: 56, border: 'none', background: '#fff' }} />
                  {weekDays.map((day, i) => {
                    const today = isToday(day);
                    return (
                      <th key={i} style={{
                        textAlign: 'center', padding: '12px 4px 10px',
                        borderBottom: '1px solid #edf1f8', background: '#fff',
                      }}>
                        <span style={{
                          display: 'block', fontSize: '.72rem', fontWeight: 700,
                          textTransform: 'capitalize', letterSpacing: '.04em',
                          color: today ? 'var(--primary)' : 'var(--muted)',
                        }}>
                          {DAYS_FR[(day.getDay() + 6) % 7]}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 30, height: 30, borderRadius: '50%', marginTop: 3,
                          fontSize: '.92rem', fontWeight: 700,
                          background: today ? '#eef4ff' : 'transparent',
                          color: today ? 'var(--primary)' : 'var(--text)',
                          border: today ? '1.5px solid #b8d0f9' : 'none',
                        }}>
                          {day.getDate()}
                        </span>
                        <span style={{ display: 'block', fontSize: '.7rem', color: 'var(--muted)', marginTop: 1 }}>
                          {day.toLocaleDateString('fr-FR', { month: 'short' })}.
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour} style={{ height: 60 }}>
                    <td style={{
                      width: 56, textAlign: 'right', paddingRight: 12,
                      fontSize: '.72rem', fontWeight: 500, color: 'var(--muted)',
                      verticalAlign: 'top', paddingTop: 8,
                      border: 'none', borderTop: '1px solid #f0f3fa',
                      fontFamily: '\'DM Mono\', monospace', whiteSpace: 'nowrap',
                      background: '#fff',
                    }}>
                      {hour}:00
                    </td>
                    {weekDays.map((day, di) => {
                      const sessions = getCoursForDayHour(day, hour);
                      return (
                        <td key={di} style={{ position: 'relative', padding: 2, border: '1px solid #f0f3fa' }}>
                          {sessions.map((s) => {
                            const debut = s.debut ?? `${String(s.heureDebut ?? 0).padStart(2, '0')}:00`;
                            const fin = s.fin ?? `${String(s.heureFin ?? 0).padStart(2, '0')}:00`;
                            const [sh, sm] = debut.split(':').map(Number);
                            const [eh, em] = fin.split(':').map(Number);
                            const durationH = eh + em / 60 - (sh + sm / 60);
                            return (
                              <div
                                key={s.id}
                                className={`ens-session ens-session-${TYPE_COLORS[s.type] ?? 'cm'}`}
                                style={{ height: `${Math.max(durationH * 60 - 4, 44)}px`, top: 2 }}
                                onClick={() => navigate(`/etudiant/seance/${s.id}`)}
                              >
                                <div className="ens-session-title">{s.titre ?? s.matiere ?? 'Cours'}</div>
                                <div className="ens-session-room">{s.salle}</div>
                                <div className="ens-session-time">{debut} - {fin}</div>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}

          {view === 'Jour' && (
            <div className="cal-day-view">
              <div className="cal-day-title">
                {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {HOURS.map(hour => {
                const sessions = getCoursForDayHour(currentDate, hour);
                return (
                  <div key={hour} className="cal-day-row">
                    <div className="cal-day-time">{hour}:00</div>
                    <div className="cal-day-events">
                      {sessions.length === 0 ? (
                        <div className="cal-day-empty">Aucun cours</div>
                      ) : (
                        sessions.map(s => {
                          const debut = s.debut ?? `${String(s.heureDebut ?? 0).padStart(2, '0')}:00`;
                          const fin = s.fin ?? `${String(s.heureFin ?? 0).padStart(2, '0')}:00`;
                          return (
                            <button
                              key={s.id}
                              className={`cal-day-event-card ens-session-${TYPE_COLORS[s.type] ?? 'cm'}`}
                              onClick={() => navigate(`/etudiant/seance/${s.id}`)}
                            >
                              <span className="cal-day-event-title">{s.titre ?? s.matiere ?? 'Cours'}</span>
                              <span className="cal-day-event-meta">{s.salle} - {debut} - {fin}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'Mois' && (
            <div className="cal-month-view">
              <div className="cal-month-weekdays">
                {DAYS_FR.map(day => (
                  <div key={day} className="cal-month-weekday">{day}</div>
                ))}
              </div>
              <div className="cal-month-grid">
                {monthWeeks.flat().map((day, idx) => {
                  const inCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const sessions = inCurrentMonth ? getCoursForDate(day) : [];
                  const today = isToday(day);
                  return (
                    <div key={`${day.toISOString()}-${idx}`} className={`cal-month-cell ${!inCurrentMonth ? 'outside' : ''}`}>
                      <div className="cal-month-cell-head">
                        <span className={`cal-month-date ${today ? 'today' : ''}`}>{day.getDate()}</span>
                      </div>
                      <div className="cal-month-items">
                        {sessions.slice(0, 2).map(s => {
                          const debut = s.debut ?? `${String(s.heureDebut ?? 0).padStart(2, '0')}:00`;
                          return (
                            <button
                              key={s.id}
                              className={`cal-month-item ens-session-${TYPE_COLORS[s.type] ?? 'cm'}`}
                              onClick={() => navigate(`/etudiant/seance/${s.id}`)}
                            >
                              <span>{s.matiere}</span>
                              <small>{debut}</small>
                            </button>
                          );
                        })}
                        {sessions.length > 2 && <div className="cal-month-more">+{sessions.length - 2}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
