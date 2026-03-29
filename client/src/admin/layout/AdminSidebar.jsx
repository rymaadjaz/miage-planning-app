import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { getUser } from '../../services/api';
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2>Administration</h2>
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
      <div className="info_users" style={{ position: 'absolute', bottom: '20px', width: '100%'}}>
        {user ? `Info : ${user.prenom} ${user.nom} ${user.role}` : "Invité"}
      </div>
    </aside>
  );
}