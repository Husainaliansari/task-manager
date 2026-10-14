import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { GuestRoute, ProtectedRoute } from './components/RouteGuards';
import Layout from './components/Layout';
import { CompassIcon } from './components/icons';
import ActivityPage from './pages/ActivityPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TasksPage from './pages/TasksPage';
import TeamPage from './pages/TeamPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<TasksPage />} />
              <Route path="team" element={<ProtectedRoute adminOnly><TeamPage /></ProtectedRoute>} />
              <Route path="activity" element={<ProtectedRoute adminOnly><ActivityPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="empty empty--page">
      <div className="empty__art" aria-hidden="true">
        <CompassIcon size={26} />
      </div>
      <h2>This page wandered off</h2>
      <p className="muted">We couldn't find what you were looking for.</p>
      <Link to="/" className="btn btn--primary">Back to my tasks</Link>
    </div>
  );
}
