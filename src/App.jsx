import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, RequireSession } from './components/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './routes/LoginPage';
import { ChangePasswordPage } from './routes/ChangePasswordPage';
import { HomePage } from './routes/HomePage';
import { ComingSoonPage } from './routes/ComingSoonPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/cambiar-password"
              element={
                <RequireSession>
                  <ChangePasswordPage />
                </RequireSession>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute roles={['RECEPCION', 'ADMIN']}>
                    <ComingSoonPage title="Clientes" />
                  </ProtectedRoute>
                }
              />
              <Route path="/ordenes" element={<ComingSoonPage title="Órdenes" />} />
              <Route
                path="/equipos"
                element={
                  <ProtectedRoute roles={['TECNICO', 'ADMIN']}>
                    <ComingSoonPage title="Equipos" />
                  </ProtectedRoute>
                }
              />
              <Route path="/repuestos" element={<ComingSoonPage title="Repuestos" />} />
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <ComingSoonPage title="Reportes" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <ComingSoonPage title="Usuarios" />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
