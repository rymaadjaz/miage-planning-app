import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages globales
import Login from './pages/Login';
import Profile from './pages/Profile';

// Enseignant
import EnseignantCalendar from './enseignant/pages/EnseignantCalendar';
import EnseignantNotifications from './enseignant/pages/EnseignantNotifications';
import EnseignantDemandes from './enseignant/pages/EnseignantDemandes';
import EnseignantNouvelleDemandeReservation from './enseignant/pages/EnseignantNouvelleDemandeReservation';
import EnseignantCohortes from './enseignant/pages/EnseignantCohortes';

// Étudiant
import EtudiantPage from './etudiant/pages/EtudiantPage';
import EtudiantNotifications from './etudiant/pages/EtudiantNotifications';

// Admin
import AdminLayout from './admin/layout/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminGeneration from './admin/pages/AdminGeneration';
import AdminReservations from './admin/pages/AdminReservations';
import AdminConflits from './admin/pages/AdminConflits';
import AdminSalles from './admin/pages/AdminSalles';
import AdminUtilisateurs from './admin/pages/AdminUtilisateurs';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Redirection initiale vers login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Page login (IMPORTANT pour logout) */}
        <Route path="/login" element={<Login />} />

        {/* Redirection admin users */}
        <Route path="/users" element={<Navigate to="/admin/utilisateurs" replace />} />

        <Route path="/profil" element={<Profile />} />

        {/* Enseignant */}
        <Route path="/enseignant" element={<EnseignantCalendar />} />
        <Route path="/calendar" element={<Navigate to="/enseignant" replace />} />
        <Route path="/enseignant/notifications" element={<EnseignantNotifications />} />
        <Route path="/enseignant/demandes" element={<EnseignantDemandes />} />
        <Route
          path="/enseignant/demandes/nouvelle-reservation"
          element={<EnseignantNouvelleDemandeReservation />}
        />
        <Route path="/enseignant/seance/:id" element={<Navigate to="/enseignant" replace />} />
        <Route path="/enseignant/cohortes" element={<EnseignantCohortes />} />

        {/* Étudiant */}
        <Route path="/etudiant" element={<EtudiantPage />} />
        <Route path="/etudiant/notifications" element={<EtudiantNotifications />} />
        <Route path="/etudiant/seance/:id" element={<Navigate to="/etudiant" replace />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="generation" element={<AdminGeneration />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="conflits" element={<AdminConflits />} />
          <Route path="salles" element={<AdminSalles />} />
          <Route path="utilisateurs" element={<AdminUtilisateurs />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;