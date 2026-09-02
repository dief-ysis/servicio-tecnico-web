import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { consultarSeguimiento } from './tracking';

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('tracking api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('consulta /seguimiento/:codigo y devuelve los equipos', async () => {
    const equipos = [{ idInterno: 'OT-1-1', estado: 'EN_DIAGNOSTICO', fechaUltimoCambio: '2026-09-01T10:00:00.000Z', notas: [] }];
    fetch.mockResolvedValue(jsonResponse(200, { equipos }));

    const res = await consultarSeguimiento('abc123');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/seguimiento/abc123');
    expect(res).toEqual({ equipos });
  });

  test('codifica el código para que un valor raro no rompa la URL', async () => {
    fetch.mockResolvedValue(jsonResponse(200, { equipos: [] }));

    await consultarSeguimiento('a b/c?d');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/seguimiento/a%20b%2Fc%3Fd');
  });

  test('429 lanza demasiados_intentos', async () => {
    fetch.mockResolvedValue(jsonResponse(429, { error: 'demasiados_intentos', retryAfter: 900 }));

    await expect(consultarSeguimiento('abc123')).rejects.toThrow('demasiados_intentos');
  });

  test('fallo de red lanza fallo_red', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(consultarSeguimiento('abc123')).rejects.toThrow('fallo_red');
  });

  test('no envía cabecera Authorization: es un endpoint público', async () => {
    fetch.mockResolvedValue(jsonResponse(200, { equipos: [] }));

    await consultarSeguimiento('abc123');

    // Un solo argumento: ni init ni headers. Si alguien migra esto a apiFetch,
    // el token del personal logueado viajaría a una ruta pública.
    expect(fetch.mock.calls[0]).toHaveLength(1);
  });
});
