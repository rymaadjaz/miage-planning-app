import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { clearToken } from '../../services/api';
const menuItems = [
  { path: '/admin', label: 'Tableau de bord', icon: '📊' },
  { path: '/admin/generation', label: 'Génération auto', icon: '⚙️' },
  { path: '/admin/reservations', label: 'Réservations', icon: '📅' },
  { path: '/admin/conflits', label: 'Conflits', icon: '⚠️' },
  { path: '/admin/salles', label: 'Salles', icon: '🏢' },
  { path: '/admin/utilisateurs', label: 'Utilisateurs', icon: '👥' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2>Admin</h2>
      </div>
      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`admin-sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="admin-sidebar-icon">{item.icon}</span>
            <span className="admin-sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="admin-sidebar-footer">
        <div
          className="admin-sidebar-logout-title"
          role="button"
          tabIndex={0}
          onClick={handleLogout}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleLogout();
            }
          }}
          aria-label="Se déconnecter"
        >
          <svg className="admin-sidebar-logout-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3V11M7.75 5.34C5.56 6.67 4.1 9.07 4.1 11.8C4.1 15.99 7.53 19.4 11.75 19.4C15.97 19.4 19.4 15.99 19.4 11.8C19.4 9.07 17.94 6.67 15.75 5.34"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span>Se deconnecter</span>
        </div>
      </div>
    </aside>
  );
}