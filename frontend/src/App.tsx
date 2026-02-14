import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { LoadingSpinner } from './components/ui';
import { ROLES } from './constants';
import { useAuth } from './context/AuthContext';
import ContactForm from './pages/contacts/ContactForm';
import ContactList from './pages/contacts/ContactList';
import Wastebin from './pages/contacts/Wastebin';
import Login from './pages/Login';
import SellerForm from './pages/sellers/SellerForm';
import SellerList from './pages/sellers/SellerList';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== ROLES.ADMIN) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/contacts" replace />} />
        <Route path="contacts" element={<ContactList />} />
        <Route path="contacts/new" element={<ContactForm />} />
        <Route path="contacts/wastebin" element={<Wastebin />} />
        <Route
          path="sellers"
          element={
            <AdminRoute>
              <SellerList />
            </AdminRoute>
          }
        />
        <Route
          path="sellers/new"
          element={
            <AdminRoute>
              <SellerForm />
            </AdminRoute>
          }
        />
        <Route
          path="sellers/:id/edit"
          element={
            <AdminRoute>
              <SellerForm />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}
