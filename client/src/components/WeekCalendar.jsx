import { Fragment } from 'react';
import './WeekCalendar.css';

const COURSE_TYPES = {
  CM: { label: 'CM', color: '#DC2626' },
  TD: { label: 'TD', color: '#F59E0B' },
  TP: { label: 'TP', color: '#3B82F6' },
  EXAM: { label: 'Examen', color: '#10B981' },
};

const DAYS_FR = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
const HOURS = [8,9,10,11,12,13,14,15,16,17,18];
const CELL_H = 52;

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d;
}

function getDaysInMonth(date) {
  const days = [];
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  while (d.getMonth() === date.getMonth()) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function isToday(date) {
  const t = new Date();
  return date.toDateString() === t.toDateString();
}

export default function WeekCalendar({
  cours = [],
  currentDate = new Date(),
  view = 'Semaine',
  onSessionClick = () => {}
}) {
  const monday = getMonday(currentDate);
  const weekDaysAll = DAYS_FR.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { name, date: d, index: i };
  });

  const weekDays =
    view === 'Jour'
      ? [{ name: DAYS_FR[(currentDate.getDay() + 6) % 7], date: new Date(currentDate), index: (currentDate.getDay() + 6) % 7 }]
      : view === 'Mois'
      ? getDaysInMonth(currentDate).map((date, i) => ({
          name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          date,
          index: i,
        }))
      : weekDaysAll;

  return (
    <div className="cal-outer">
      <div className="cal-legend">
        {Object.entries(COURSE_TYPES).map(([key,val])=>(
          <div key={key} className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background: val.color }} />
            {val.label}
          </div>
        ))}
      </div>
      <div className="cal-grid">
        <div className="cal-header-spacer" />
        {weekDays.map(({name,date,index})=>(
          <div key={index} className="cal-day-header">
            <span className="cal-day-name">{name}</span>
            <span className={`cal-day-num${isToday(date)? ' is-today':''}`}>{date.getDate()}</span>
            <span className={`cal-day-month${isToday(date)? ' is-today':''}`}>
              {date.toLocaleDateString('fr-FR',{month:'short'}).replace('.','')}
            </span>
          </div>
        ))}
        {HOURS.map(hour=>(
          <Fragment key={hour}>
            <div className="cal-time-cell">{hour}:00</div>
            {weekDays.map(({index:jourIdx, date})=>{
              const coursIci = cours.filter(c => {
                if (view === 'Mois' || view === 'Jour') {
                  const dayIndex = (date.getDay() + 6) % 7;
                  return c.jour === dayIndex && c.heureDebut === hour;
                }
                return c.jour === jourIdx && c.heureDebut === hour;
              });
              return (
                <div key={`${hour}-${jourIdx}`} className="cal-cell">
                  {coursIci.map(c=>{
                    const duree = c.heureFin - c.heureDebut;
                    const couleur = COURSE_TYPES[c.type]?.color || '#6b7280';
                    const hauteur = duree*CELL_H - 6;
                    return (
                      <div
                        key={c.id}
                        className="course-blk"
                        title={`${c.matiere} — ${c.salle}`}
                        style={{ background: couleur, height: `${hauteur}px` }}
                        onClick={() => onSessionClick(c.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSessionClick(c.id)}
                      >
                        <div className="course-blk-title">{c.matiere}</div>
                        <div className="course-blk-salle">{c.salle}</div>
                        <div className="course-blk-heure">{c.heureDebut}:00 - {c.heureFin}:00</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}