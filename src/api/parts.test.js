import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getParts } from './parts';
import { apiFetch } from '../lib/api';

vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
}));

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('parts api', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  test('getParts pide /repuestos y devuelve el catálogo', async () => {
    const repuestos = [{ id: 1, nombre: 'Fusible 5A', codigoSku: null, stockActual: 12, stockMinimo: 2, activo: true }];
    apiFetch.mockResolvedValue(jsonResponse(200, repuestos));

    const result = await getParts();

    expect(apiFetch).toHaveBeenCalledWith('/repuestos');
    expect(result).toEqual(repuestos);
  });

  test('getParts lanza un Error si el backend responde con error', async () => {
    apiFetch.mockResolvedValue(jsonResponse(401, { error: 'no_autenticado' }));

    await expect(getParts()).rejects.toThrow('no_autenticado');
  });
});
