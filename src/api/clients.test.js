import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getClients, createClient, updateClient } from './clients';
import { apiFetch } from '../lib/api';

vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
}));

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('clients api', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  test('getClients arma el query string con q, limit y offset', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { data: [], total: 0, limit: 20, offset: 0 }));

    await getClients({ q: 'ana', limit: 20, offset: 40 });

    expect(apiFetch).toHaveBeenCalledWith('/clientes?q=ana&limit=20&offset=40');
  });

  test('getClients omite q si no se pasa', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { data: [], total: 0, limit: 20, offset: 0 }));

    await getClients({ limit: 20, offset: 0 });

    expect(apiFetch).toHaveBeenCalledWith('/clientes?limit=20&offset=0');
  });

  test('createClient hace POST con el body y devuelve el cliente creado', async () => {
    const payload = { nombre: 'Ana', empresa: null, telefono: '+56911111111', correo: null, rut: null };
    const creado = { id: 5, ...payload, fechaCreacion: '2026-07-19' };
    apiFetch.mockResolvedValue(jsonResponse(201, creado));

    const result = await createClient(payload);

    expect(apiFetch).toHaveBeenCalledWith('/clientes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(creado);
  });

  test('createClient lanza un Error con el código del backend si falla', async () => {
    apiFetch.mockResolvedValue(jsonResponse(400, { error: 'telefono_requerido' }));

    await expect(createClient({ nombre: 'Ana' })).rejects.toThrow('telefono_requerido');
  });

  test('updateClient hace PATCH a /clientes/:id', async () => {
    const cambios = { nombre: 'Ana Editada' };
    apiFetch.mockResolvedValue(jsonResponse(200, { id: 5, ...cambios }));

    await updateClient(5, cambios);

    expect(apiFetch).toHaveBeenCalledWith('/clientes/5', {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    });
  });
});
