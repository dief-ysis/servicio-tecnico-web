import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getTiempoTaller, getPendientes, getSinRetiro } from './reports';
import { apiFetch } from '../lib/api';

vi.mock('../lib/api', () => ({ apiFetch: vi.fn() }));

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('reports api', () => {
  beforeEach(() => apiFetch.mockReset());

  test('getTiempoTaller sin rango no manda query params', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { promedioHoras: null, porEquipo: [] }));
    await getTiempoTaller();
    expect(apiFetch).toHaveBeenCalledWith('/reportes/tiempo-taller');
  });

  test('getTiempoTaller arma el rango cuando se le pasa', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { promedioHoras: 42, porEquipo: [] }));
    await getTiempoTaller({ desde: '2026-01-01', hasta: '2026-01-31' });
    expect(apiFetch).toHaveBeenCalledWith('/reportes/tiempo-taller?desde=2026-01-01&hasta=2026-01-31');
  });

  test('getTiempoTaller admite solo una de las dos fechas', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { promedioHoras: 1, porEquipo: [] }));
    await getTiempoTaller({ desde: '2026-01-01' });
    expect(apiFetch).toHaveBeenCalledWith('/reportes/tiempo-taller?desde=2026-01-01');
  });

  test('getTiempoTaller propaga rango_invalido del backend', async () => {
    apiFetch.mockResolvedValue(jsonResponse(400, { error: 'rango_invalido' }));
    await expect(getTiempoTaller({ desde: '2026-06-01', hasta: '2026-01-01' }))
      .rejects.toThrow('rango_invalido');
  });

  test('getPendientes y getSinRetiro pegan a sus rutas', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { porEstado: [], equipos: [] }));
    await getPendientes();
    expect(apiFetch).toHaveBeenCalledWith('/reportes/pendientes');

    apiFetch.mockResolvedValue(jsonResponse(200, []));
    await getSinRetiro();
    expect(apiFetch).toHaveBeenCalledWith('/reportes/sin-retiro');
  });
});
