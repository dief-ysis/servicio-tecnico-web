import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { apiFetch, setAccessToken, setRefreshToken } from './lib/api';

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
  });

  test('sin sesión, la ruta raíz termina mostrando el login', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Servicio Técnico')).toBeInTheDocument());
  });

  test('/seguimiento es pública: se ve sin sesión, sin redirigir a login', async () => {
    // El cliente no tiene cuenta. Cualquier otra ruta sin sesión termina en
    // /login; esta no debe.
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { equipos: [] }));
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/seguimiento');

    render(<App />);

    expect(await screen.findByText('Estado de tu equipo')).toBeInTheDocument();
    expect(screen.queryByLabelText('Usuario')).not.toBeInTheDocument();
    window.history.pushState({}, '', '/');
  });

  test('sesión expirada a mitad de uso redirige a login mostrando el aviso (circuito real, sin mocks de useAuth/ProtectedRoute)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        accessToken: 'tok',
        refreshToken: 'ref',
        usuario: { id: 1, nombre: 'Ana', rol: 'RECEPCION' },
        mustChangePassword: false,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await waitFor(() => expect(screen.getByText('Servicio Técnico')).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText('Usuario'), 'ana');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => expect(screen.getByText('Hola, Ana')).toBeInTheDocument());

    // Simula que, con la sesión ya activa, una request cualquiera recibe un 401
    // y el intento de refresh también falla (sesión inválida a mitad de uso).
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(401, {}));
    await apiFetch('/algo');

    await waitFor(() => expect(screen.getByText('Servicio Técnico')).toBeInTheDocument());
    expect(screen.getByText('Tu sesión expiró, ingresa de nuevo.')).toBeInTheDocument();
  });
});
