import { useNavigate } from 'react-router-dom';

export default function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <h1>Panel Administrateur</h1>
      </div>
      <div className="admin-header-right">
        <button className="admin-header-btn" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}