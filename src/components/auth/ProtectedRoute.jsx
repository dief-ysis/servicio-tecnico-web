import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ForbiddenPage } from '../../routes/ForbiddenPage';

function LoadingScreen() {
  return <div className="min-h-screen bg-ink-950" />;
}

export function ProtectedRoute({ children, roles }) {
  const { usuario, status } = useAuth();

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (usuario.mustChangePassword) return <Navigate to="/cambiar-password" replace />;
  if (roles && !roles.includes(usuario.rol)) return <ForbiddenPage />;

  return children;
}

export function RequireSession({ children }) {
  const { status } = useAuth();

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;

  return children;
}
