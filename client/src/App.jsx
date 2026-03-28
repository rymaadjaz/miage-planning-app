import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Profile from './pages/Profile';
import EnseignantCalendar from './enseignant/pages/EnseignantCalendar';
import EnseignantNotifications from './enseignant/pages/EnseignantNotifications';
import EnseignantDemandes from './enseignant/pages/EnseignantDemandes';
import EnseignantNouvelleDemandeReservation from './enseignant/pages/EnseignantNouvelleDemandeReservation';
import EnseignantSeanceDetails from './enseignant/pages/EnseignantSeanceDetails';
import EnseignantCohortes from './enseignant/pages/EnseignantCohortes';
import EtudiantPage from './etudiant/pages/EtudiantPage';
import EtudiantNotifications from './etudiant/pages/EtudiantNotifications';
import EtudiantSeanceDetails from './etudiant/pages/EtudiantSeanceDetails';
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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/users" element={<Navigate to="/admin/utilisateurs" replace />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/enseignant" element={<EnseignantCalendar />} />
        <Route path="/calendar" element={<Navigate to="/enseignant" replace />} />
        <Route path="/enseignant/notifications" element={<EnseignantNotifications />} />
        <Route path="/enseignant/demandes" element={<EnseignantDemandes />} />
        <Route path="/enseignant/demandes/nouvelle-reservation" element={<EnseignantNouvelleDemandeReservation />} />
        <Route path="/enseignant/seance/:id" element={<EnseignantSeanceDetails />} />
        <Route path="/enseignant/cohortes" element={<EnseignantCohortes />} />

        <Route path="/etudiant" element={<EtudiantPage />} />
        <Route path="/etudiant/notifications" element={<EtudiantNotifications />} />
        <Route path="/etudiant/seance/:id" element={<EtudiantSeanceDetails />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="generation" element={<AdminGeneration />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="conflits" element={<AdminConflits />} />
          <Route path="salles" element={<AdminSalles />} />
          <Route path="utilisateurs" element={<AdminUtilisateurs />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;