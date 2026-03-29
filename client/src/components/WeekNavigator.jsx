const navigatorStyles = `
  .week-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    padding: 10px 16px;
    border-bottom: 1px solid #d8e2f0;
    font-family: 'Segoe UI', sans-serif;
  }
  .week-nav-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .today-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: #fff;
    border: 1.5px solid #bfcde2;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #1e2d4a;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s;
  }
  .today-btn:hover { background: #edf3fb; }
  .nav-arrow {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #fff;
    border: 1.5px solid #bfcde2;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e2d4a;
    transition: background 0.2s;
  }
  .nav-arrow:hover { background: #edf3fb; }
  .week-label {
    font-size: 14px;
    font-weight: 600;
    color: #1e2d4a;
    min-width: 200px;
    text-align: center;
  }
  .view-toggle {
    display: flex;
    background: #7f95b3;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(30, 45, 74, 0.08);
  }
  .view-btn {
    padding: 6px 16px;
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .view-btn.active {
    background: #fff;
    color: #1e2d4a;
    font-weight: 700;
    border-radius: 4px;
    margin: 3px;
    padding: 4px 14px;
    box-shadow: 0 1px 4px rgba(30, 45, 74, 0.2);
  }
  .view-btn:not(.active):hover { color: #fff; }
`;

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function getWeekLabel(monday) {
  return `Semaine du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

export default function WeekNavigator({ currentDate, onDateChange, view = 'Semaine', onViewChange }) {
  const monday = getMonday(currentDate);

  const goBack = () => {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7);
    onDateChange(d);
  };
  const goForward = () => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    onDateChange(d);
  };

  return (
    <>
      <style>{navigatorStyles}</style>
      <div className="week-nav">
        <div className="week-nav-left">
          <button className="today-btn" onClick={() => onDateChange(new Date())}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Aujourd'hui
          </button>
          <button className="nav-arrow" onClick={goBack}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="week-label">{getWeekLabel(monday)}</span>
          <button className="nav-arrow" onClick={goForward}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <div className="view-toggle">
          {['Jour', 'Semaine', 'Mois'].map(v => (
            <button key={v} className={`view-btn ${view === v ? 'active' : ''}`} onClick={() => onViewChange && onViewChange(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}