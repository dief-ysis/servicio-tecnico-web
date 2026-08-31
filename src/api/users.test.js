import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getUsers } from './users';
import { apiFetch } from '../lib/api';

vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
}));

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('users api', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  test('getUsers pide /usuarios y devuelve la lista', async () => {
    const usuarios = [{ id: 1, nombre: 'Ana', rol: 'TECNICO', activo: true }];
    apiFetch.mockResolvedValue(jsonResponse(200, usuarios));

    const result = await getUsers();

    expect(apiFetch).toHaveBeenCalledWith('/usuarios');
    expect(result).toEqual(usuarios);
  });

  test('getUsers lanza un Error si el backend responde con error', async () => {
    apiFetch.mockResolvedValue(jsonResponse(403, { error: 'acceso_denegado' }));

    await expect(getUsers()).rejects.toThrow('acceso_denegado');
  });
});
