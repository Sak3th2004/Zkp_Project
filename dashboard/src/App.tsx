import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ApiKeys from './pages/ApiKeys';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';
import Webhooks from './pages/Webhooks';
import Team from './pages/Team';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Playground from './pages/Playground';
import QuickStart from './pages/QuickStart';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/keys" element={<ApiKeys />} />
          <Route path="dashboard/analytics" element={<Analytics />} />
          <Route path="dashboard/logs" element={<AuditLogs />} />
          <Route path="dashboard/webhooks" element={<Webhooks />} />
          <Route path="dashboard/team" element={<Team />} />
          <Route path="dashboard/billing" element={<Billing />} />
          <Route path="dashboard/settings" element={<Settings />} />
          <Route path="dashboard/playground" element={<Playground />} />
          <Route path="dashboard/quickstart" element={<QuickStart />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
