import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import DashboardLayout from "../layouts/DashboardLayout";

import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import DashboardPage from "../pages/DashboardPage";
import AssignedTicketsPage from "../pages/AssignedTicketsPage";
import UnassignedTicketsPage from "../pages/UnassignedTicketsPage";
import TicketFormPage from "../pages/TicketFormPage";
import TicketDetailsPage from "../pages/TicketDetailsPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminClientsPage from "../pages/AdminClientsPage";

import Loader from "../components/Loader";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const HomeRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "agent") {
    return <Navigate to="/tickets/assigned" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />

        {/* Dashboard */}
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Agent */}
        <Route path="tickets/assigned" element={<AssignedTicketsPage />} />
        <Route
          path="tickets/unassigned"
          element={
            <ProtectedRoute allowedRoles={["agent"]}>
              <UnassignedTicketsPage />
            </ProtectedRoute>
          }
        />

        {/* Client */}
        <Route path="tickets/new" element={<TicketFormPage />} />
        <Route path="tickets/:id" element={<TicketDetailsPage />} />

        {/* Admin */}
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/clients"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminClientsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Unknown Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
