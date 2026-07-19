import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  apiFetch,
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  refreshSession,
  setSessionExpiredHandler,
} from './api';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    clone() { return this; },
    json: async () => body,
  };
}

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
    setSessionExpiredHandler(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('request autenticada que recibe 401 refresca el token y reintenta', async () => {
    setAccessToken('token-viejo');
    setRefreshToken('refresh-valido');

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: 'token_invalido' }))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'token-nuevo', refreshToken: 'refresh-nuevo' }))
      .mockResolvedValueOnce(jsonResponse(200, { data: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiFetch('/ordenes');
    const body = await res.json();

    expect(body).toEqual({ data: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getRefreshToken()).toBe('refresh-nuevo');
    // La request reintentada usa el access token nuevo.
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer token-nuevo');
  });

  test('request autenticada que recibe 401 y el refresh también falla limpia la sesión', async () => {
    setAccessToken('token-viejo');
    setRefreshToken('refresh-invalido');
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: 'token_invalido' }))
      .mockResolvedValueOnce(jsonResponse(401, { error: 'refresh_invalido' }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/ordenes');

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(getRefreshToken()).toBeNull();
  });

  test('request SIN token que recibe 401 (ej. login con credenciales malas) no intenta refrescar', async () => {
    // Sin setAccessToken: no hay sesión.
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(401, { error: 'credenciales_invalidas' }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiFetch('/auth/login', { method: 'POST', body: '{}' });
    const body = await res.json();

    expect(body).toEqual({ error: 'credenciales_invalidas' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('refreshSession', () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('sin refresh token guardado, no llama a fetch y devuelve false', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await refreshSession();

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('si el fetch de red falla, devuelve false en vez de lanzar', async () => {
    setRefreshToken('ref-existente');
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await refreshSession();

    expect(result).toBe(false);
  });
});
