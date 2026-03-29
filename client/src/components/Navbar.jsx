import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../services/api';

const navbarStyles = `
  .navbar {
    background: #1e2d4a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 62px;
    border-radius: 0;
    margin-bottom: 0;
    box-shadow: none;
    font-family: 'Segoe UI', sans-serif;
  }
  .navbar-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .navbar-logo {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.15);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .navbar-titles h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
  }
  .navbar-titles p {
    margin: 0;
    font-size: 11px;
    color: rgba(255,255,255,0.45);
  }
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
  }
  .navbar-export-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: rgba(255,255,255,0.12);
    border: none;
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s;
  }
  .navbar-export-btn:hover { background: rgba(255,255,255,0.2); }
  .navbar-icon-btn {
    position: relative;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .navbar-icon-btn:hover { background: rgba(255,255,255,0.22); }
  .profile-dropdown {
    position: absolute;
    top: 46px;
    right: 0;
    min-width: 176px;
    background: #fff;
    border: 1px solid #dbe3ef;
    border-radius: 11px;
    box-shadow: 0 7px 16px rgba(16, 30, 60, 0.14);
    overflow: hidden;
    z-index: 1200;
    padding: 3px;
  }
  .profile-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    border: none;
    background: transparent;
    color: #8a96a8;
    padding: 7px 9px;
    text-align: left;
    font-family: inherit;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    border-radius: 6px;
    line-height: 1;
  }
  .profile-item:hover {
    background: #f2f6fc;
    color: #5e6f86;
  }
  .profile-item.logout {
    background: #2d4d75;
    color: #fff;
    border-radius: 6px;
    width: 100%;
    margin-top: 3px;
    font-weight: 700;
    padding: 8px 9px;
  }
  .profile-item.logout:hover {
    background: #243e61;
    color: #fff;
  }
  .profile-separator {
    height: 1px;
    background: #e7edf7;
    margin: 1px 0 0;
  }
  .notif-badge {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 14px;
    height: 14px;
    background: #F5A623;
    border-radius: 50%;
    border: 2px solid #1e2d4a;
    font-size: 8px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
`;

export default function Navbar({ notifCount = 3, onExport, onNotifications, onProfile, onLogout }) {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleExport = () => {
    if (typeof onExport === 'function') {
      onExport();
    } else {
      alert('Export : fonctionnalité active uniquement depuis la page calendrier.');
    }
  };

  const handleNotifications = () => {
    if (typeof onNotifications === 'function') {
      onNotifications();
    } else {
      navigate('/enseignant/notifications');
    }
  };

  const handleProfile = () => {
    if (typeof onProfile === 'function') {
      onProfile();
      return;
    }
    navigate('/profil');
  };

  const handleLogout = () => {
    if (typeof onLogout === 'function') {
      onLogout();
      return;
    }
    clearToken();
    navigate('/login');
  };

  return (
    <>
      <style>{navbarStyles}</style>
      <nav className="navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div className="navbar-titles">
            <h2>Mon emploi du temps</h2>
            <p>Année universitaire 2025-2026</p>
          </div>
        </div>
        <div className="navbar-right" ref={profileRef}>
          <button className="navbar-export-btn" onClick={handleExport}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exporter
          </button>
          <button className="navbar-icon-btn" aria-label="Notifications" onClick={handleNotifications}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
          </button>
          <button className="navbar-icon-btn" aria-label="Profil" onClick={() => setIsProfileOpen(v => !v)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <button
                className="profile-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  handleProfile();
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Mon profil
              </button>
              <div className="profile-separator" />
              <button
                className="profile-item logout"
                onClick={() => {
                  setIsProfileOpen(false);
                  handleLogout();
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}