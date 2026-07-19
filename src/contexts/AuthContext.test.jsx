import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { setAccessToken, setRefreshToken } from '../lib/api';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    clone() { return this; },
    json: async () => body,
  };
}

function Probe() {
  const { usuario, status, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="usuario">{usuario ? usuario.nombre : 'ninguno'}</span>
      <button onClick={() => login('demo', 'pass').catch(() => {})}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('sin refresh token guardado, arranca en unauthenticated sin llamar a fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('login exitoso guarda el usuario y pasa a authenticated', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        accessToken: 'tok',
        refreshToken: 'ref',
        usuario: { id: 1, nombre: 'Ana', rol: 'RECEPCION' },
        mustChangePassword: false,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));

    await userEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('usuario').textContent).toBe('Ana'));
    expect(screen.getByTestId('status').textContent).toBe('authenticated');
  });

  test('login fallido no cambia el estado a authenticated', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(401, { error: 'credenciales_invalidas' }));
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));

    await userEvent.click(screen.getByText('login'));

    expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('usuario').textContent).toBe('ninguno');
  });

  test('con refresh token guardado, restaura la sesión automáticamente vía refresh + /auth/me', async () => {
    setRefreshToken('ref-existente');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'tok-nuevo', refreshToken: 'ref-nuevo' }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 2, nombre: 'Beto', rol: 'TECNICO', mustChangePassword: false }));
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('usuario').textContent).toBe('Beto'));
    expect(screen.getByTestId('status').textContent).toBe('authenticated');
  });

  test('logout limpia la sesión', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          accessToken: 'tok',
          refreshToken: 'ref',
          usuario: { id: 1, nombre: 'Ana', rol: 'RECEPCION' },
          mustChangePassword: false,
        })
      )
      .mockResolvedValueOnce(jsonResponse(204, {}));
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));
    await userEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authenticated'));

    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));
    expect(screen.getByTestId('usuario').textContent).toBe('ninguno');
  });

  test('con refresh token guardado, si la red falla al restaurar la sesión termina en unauthenticated (no se queda en loading)', async () => {
    setRefreshToken('ref-existente');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'tok-nuevo', refreshToken: 'ref-nuevo' }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));
  });

  test('logout limpia la sesión localmente aunque la llamada a la API falle', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          accessToken: 'tok',
          refreshToken: 'ref',
          usuario: { id: 1, nombre: 'Ana', rol: 'RECEPCION' },
          mustChangePassword: false,
        })
      )
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));
    await userEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authenticated'));

    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'));
    expect(screen.getByTestId('usuario').textContent).toBe('ninguno');
  });
});
