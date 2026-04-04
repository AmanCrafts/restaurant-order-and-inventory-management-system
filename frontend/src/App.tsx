import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth';
import {
  Dashboard,
  StaffManagement,
  MenuManagement,
  InventoryManagement,
  TablesManagement,
  Bills,
} from './pages/admin';
import { WaiterOrders } from './pages/waiter';
import { Kitchen } from './pages/cook';
import { UserRole } from './types';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <StaffManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <MenuManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <InventoryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tables"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <TablesManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bills"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.WAITER]}>
                <Bills />
              </ProtectedRoute>
            }
          />

          {/* Waiter Routes */}
          <Route
            path="/waiter/orders"
            element={
              <ProtectedRoute requiredRoles={[UserRole.WAITER, UserRole.ADMIN]}>
                <WaiterOrders />
              </ProtectedRoute>
            }
          />

          {/* Cook Routes */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute requiredRoles={[UserRole.COOK, UserRole.ADMIN]}>
                <Kitchen />
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
