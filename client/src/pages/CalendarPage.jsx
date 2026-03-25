import { useState } from "react";
import Navbar from "../components/Navbar";
import WeekNavigator from "../components/WeekNavigator";
import WeekCalendar from "../components/WeekCalendar";
import { mockEnseignantCours } from "../data/mockData";

const pageStyles = `
  .ens-page {
    background: #f0f2f5;
    min-height: 100vh;
    font-family: 'Segoe UI', sans-serif;
  }
  .ens-breadcrumb {
    font-size: 13px;
    color: #888;
    padding: 10px 16px 6px;
  }
  .ens-body {
    padding: 0 16px 24px;
  }
  .ens-card {
    background: #fff;
    border-radius: 10px;
    border: 1px solid #cfd9e8;
    margin-bottom: 12px;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(30, 45, 74, 0.08);
  }
  .actions-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px 10px;
    font-size: 13px;
    font-weight: 600;
    color: #1e2d4a;
    border-bottom: 1px solid #dde6f3;
  }
  .actions-btns {
    display: flex;
    gap: 10px;
    padding: 12px 16px;
  }
  .action-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 14px;
    border: 1.5px solid #c2cfe2;
    border-radius: 6px;
    background: #fff;
    font-size: 13px;
    font-weight: 500;
    color: #1e2d4a;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
  }
  .action-btn:hover {
    background: #eef3fb;
    border-color: #9db2cf;
    color: #163457;
  }
`;

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("Semaine");

  return (
    <>
      <style>{pageStyles}</style>
      <div className="ens-page">
        <Navbar />
        <div className="ens-breadcrumb"></div>
        <div className="ens-body">

          {/* Actions rapides */}
          <div className="ens-card">
            <div className="actions-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e2d4a" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Actions rapides
            </div>
            <div className="actions-btns">
              <button className="action-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Demande de réservation
              </button>
              <button className="action-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                EDT Cohortes
              </button>
            </div>
          </div>

          {/* Navigateur semaine */}
          <div className="ens-card">
            <WeekNavigator
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              view={view}
              onViewChange={setView}
            />
            <WeekCalendar cours={mockEnseignantCours} currentDate={currentDate} />
          </div>

        </div>
      </div>
    </>
  );
}