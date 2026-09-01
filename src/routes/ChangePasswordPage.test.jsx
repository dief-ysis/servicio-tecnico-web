import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChangePasswordPage } from './ChangePasswordPage';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, setAccessToken, setRefreshToken } from '../lib/api';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    useAuth.mockReset();
    apiFetch.mockReset();
    setAccessToken.mockReset();
    setRefreshToken.mockReset();
    mockNavigate.mockClear();
  });

  test('cambio exitoso guarda los tokens nuevos que devuelve el backend', async () => {
    // El backend revoca todos los refresh tokens al cambiar la contraseña y
    // devuelve un par nuevo. Si el frontend no lo guarda, la sesión queda con
    // un token revocado y muere sola al vencer el access token.
    const refreshUsuario = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ refreshUsuario });
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'access-nuevo', refreshToken: 'refresh-nuevo' }),
    });

    render(<MemoryRouter><ChangePasswordPage /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'temp123');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'NuevaSegura456!');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(setAccessToken).toHaveBeenCalledWith('access-nuevo'));
    expect(setRefreshToken).toHaveBeenCalledWith('refresh-nuevo');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  test('cambio exitoso refresca el usuario', async () => {
    const refreshUsuario = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ refreshUsuario });
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<MemoryRouter><ChangePasswordPage /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'temp123');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'NuevaSegura456!');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(refreshUsuario).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  test('contraseña actual incorrecta muestra error', async () => {
    useAuth.mockReturnValue({ refreshUsuario: vi.fn() });
    apiFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'contrasena_incorrecta' }) });

    render(<MemoryRouter><ChangePasswordPage /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'mala');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'NuevaSegura456!');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('La contraseña actual no es correcta.')).toBeInTheDocument();
  });
});
