import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, RequireSession } from './ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderAt(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/protegida" element={element} />
        <Route path="/login" element={<div>Página de login</div>} />
        <Route path="/cambiar-password" element={<div>Cambiar contraseña</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  test('sin sesión, redirige a /login', () => {
    useAuth.mockReturnValue({ usuario: null, status: 'unauthenticated' });
    renderAt('/protegida', <ProtectedRoute>contenido</ProtectedRoute>);
    expect(screen.getByText('Página de login')).toBeInTheDocument();
  });

  test('con sesión pero mustChangePassword, redirige a /cambiar-password', () => {
    useAuth.mockReturnValue({
      usuario: { rol: 'TECNICO', mustChangePassword: true },
      status: 'authenticated',
    });
    renderAt('/protegida', <ProtectedRoute>contenido</ProtectedRoute>);
    expect(screen.getByText('Cambiar contraseña')).toBeInTheDocument();
  });

  test('con sesión y rol no permitido, muestra ForbiddenPage', () => {
    useAuth.mockReturnValue({
      usuario: { rol: 'TECNICO', mustChangePassword: false },
      status: 'authenticated',
    });
    renderAt('/protegida', <ProtectedRoute roles={['ADMIN']}>contenido</ProtectedRoute>);
    expect(screen.getByText('Sin permiso')).toBeInTheDocument();
  });

  test('con sesión y rol permitido, renderiza el contenido', () => {
    useAuth.mockReturnValue({
      usuario: { rol: 'ADMIN', mustChangePassword: false },
      status: 'authenticated',
    });
    renderAt('/protegida', <ProtectedRoute roles={['ADMIN']}>contenido</ProtectedRoute>);
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });
});

describe('RequireSession', () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  test('sin sesión, redirige a /login', () => {
    useAuth.mockReturnValue({ status: 'unauthenticated' });
    renderAt('/protegida', <RequireSession>contenido</RequireSession>);
    expect(screen.getByText('Página de login')).toBeInTheDocument();
  });

  test('con sesión, renderiza el contenido aunque mustChangePassword sea true', () => {
    useAuth.mockReturnValue({ status: 'authenticated' });
    renderAt('/protegida', <RequireSession>contenido</RequireSession>);
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });
});
