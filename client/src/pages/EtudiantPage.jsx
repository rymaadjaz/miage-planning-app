// src/pages/EtudiantPage.jsx
import { useState } from "react";
import Navbar from "../components/Navbar";
import WeekNavigator from "../components/WeekNavigator";
import WeekCalendar from "../components/WeekCalendar";
import { mockEtudiantCours, mockEnseignants } from "../data/mockData";

const pageStyles = `
  .etu-page { 
    background: #f0f2f5;
    min-height: 100vh;
    font-family: 'Segoe UI', sans-serif;
  }
  .etu-breadcrumb {
    font-size: 13px;
    color: #888;
    padding: 10px 16px 6px;
  }
  .etu-body {
    padding: 0 16px 24px;
  }
  .etu-card {
    background: #fff;
    border-radius: 10px;
    border: 1px solid #cfd9e8;
    margin-bottom: 12px;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(30, 45, 74, 0.08);
  }
  .filters-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 600;
    color: #1e2d4a;
  }
  .filters-row {
    display: flex;
    gap: 10px;
    padding: 0 16px 14px;
  }
  .filter-select-wrap {
    position: relative;
  }
  .filter-select {
    appearance: none;
    padding: 7px 32px 7px 12px;
    border: 1.5px solid #c2cfe2;
    border-radius: 6px;
    background: #fff;
    font-size: 13px;
    color: #1e2d4a;
    cursor: pointer;
    font-family: inherit;
    font-weight: 500;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    min-width: 150px;
  }
  .filter-select:focus {
    border-color: #7f95b3;
    background: #f7faff;
  }
  .filter-arrow {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #666;
  }
`;

const TYPES = ['Tous les type', 'Cours Magistral', 'Travaux Dirigés', 'Travaux Pratiques', 'Examen'];

export default function EtudiantPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("Semaine");
  const [typeFilter, setTypeFilter] = useState("Tous les type");
  const [ensFilter, setEnsFilter] = useState("Tous les enseignants");

  const typeMap = {
    'Cours Magistral': 'CM',
    'Travaux Dirigés': 'TD',
    'Travaux Pratiques': 'TP',
    'Examen': 'Examen',
  };

  const coursFiltres = mockEtudiantCours.filter(c => {
    const typeOk = typeFilter === 'Tous les type' || c.type === typeMap[typeFilter];
    const ensOk = ensFilter === 'Tous les enseignants' || c.enseignant === ensFilter;
    return typeOk && ensOk;
  });

  return (
    <>
      <style>{pageStyles}</style>
      <div className="etu-page">
        <Navbar />
        <div className="etu-breadcrumb"></div>
        <div className="etu-body">

          {/* Navigateur semaine */}
          <div className="etu-card">
            <WeekNavigator
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              view={view}
              onViewChange={setView}
            />
          </div>

          {/* Filtres */}
          <div className="etu-card">
            <div className="filters-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e2d4a" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filtres
            </div>
            <div className="filters-row">
              {/* Type */}
              <div className="filter-select-wrap">
                <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <span className="filter-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
              {/* Enseignant */}
              <div className="filter-select-wrap">
                <select className="filter-select" value={ensFilter} onChange={e => setEnsFilter(e.target.value)}>
                  {mockEnseignants.map(e => <option key={e.id}>{e.nom}</option>)}
                </select>
                <span className="filter-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
            </div>

            <WeekCalendar cours={coursFiltres} currentDate={currentDate} />
          </div>

        </div>
      </div>
    </>
  );
}