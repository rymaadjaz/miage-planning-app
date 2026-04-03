import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import '../../styles/admin.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
