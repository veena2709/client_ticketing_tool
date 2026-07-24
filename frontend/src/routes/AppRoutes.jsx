import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import DashboardPage from '../pages/DashboardPage';
import TicketFormPage from '../pages/TicketFormPage';
import TicketDetailsPage from '../pages/TicketDetailsPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminClientsPage from '../pages/AdminClientsPage';
import Loader from '../components/Loader';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tickets/new" element={<TicketFormPage />} />
        <Route path="tickets/:id" element={<TicketDetailsPage />} />
        <Route path="tickets/unassigned" element={<DashboardPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/clients" element={<AdminClientsPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
