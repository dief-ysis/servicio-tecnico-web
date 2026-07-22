import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getOrders, getOrder, createOrder } from './orders';
import { apiFetch } from '../lib/api';

vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
}));

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('orders api', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  test('getOrders arma el query string con cliente_id, limit y offset', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { data: [], total: 0, limit: 20, offset: 0 }));

    await getOrders({ clienteId: 3, limit: 20, offset: 40 });

    expect(apiFetch).toHaveBeenCalledWith('/ordenes?cliente_id=3&limit=20&offset=40');
  });

  test('getOrders omite cliente_id si no se pasa', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { data: [], total: 0, limit: 20, offset: 0 }));

    await getOrders({ limit: 20, offset: 0 });

    expect(apiFetch).toHaveBeenCalledWith('/ordenes?limit=20&offset=0');
  });

  test('getOrder pide /ordenes/:id', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { id: 7 }));

    await getOrder(7);

    expect(apiFetch).toHaveBeenCalledWith('/ordenes/7');
  });

  test('createOrder hace POST con el body y devuelve la orden creada', async () => {
    const payload = { clienteId: 3, equipos: [{ tipoModelo: 'Consola', fallaReportada: 'No enciende' }] };
    const creada = { id: 5, ...payload };
    apiFetch.mockResolvedValue(jsonResponse(201, creada));

    const result = await createOrder(payload);

    expect(apiFetch).toHaveBeenCalledWith('/ordenes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(creada);
  });

  test('createOrder lanza un Error con el código del backend si falla', async () => {
    apiFetch.mockResolvedValue(jsonResponse(400, { error: 'equipos_requeridos' }));

    await expect(createOrder({ clienteId: 3, equipos: [] })).rejects.toThrow('equipos_requeridos');
  });
});
