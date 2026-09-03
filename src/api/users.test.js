import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getUsers, createUser, updateUser } from './users';
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

  test('createUser hace POST y devuelve el usuario con su contraseña temporal', async () => {
    const creado = { usuario: { id: 9, nombre: 'Nuevo' }, contrasenaTemp: 'a1b2c3d4' };
    apiFetch.mockResolvedValue(jsonResponse(201, creado));

    const res = await createUser({ nombre: 'Nuevo', identificador: 'nuevo@taller.cl', rol: 'TECNICO' });

    expect(apiFetch).toHaveBeenCalledWith('/usuarios', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Nuevo', identificador: 'nuevo@taller.cl', rol: 'TECNICO' }),
    });
    expect(res).toEqual(creado);
  });

  test('createUser lanza el código del backend si el identificador ya existe', async () => {
    apiFetch.mockResolvedValue(jsonResponse(409, { error: 'identificador_en_uso' }));

    await expect(createUser({ nombre: 'X', identificador: 'dup@taller.cl', rol: 'TECNICO' }))
      .rejects.toThrow('identificador_en_uso');
  });

  test('updateUser hace PATCH solo con los campos provistos', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { id: 5, activo: false }));

    await updateUser(5, { activo: false });

    expect(apiFetch).toHaveBeenCalledWith('/usuarios/5', {
      method: 'PATCH',
      body: JSON.stringify({ activo: false }),
    });
  });

  test('updateUser propaga la guarda de auto-bloqueo del backend', async () => {
    apiFetch.mockResolvedValue(jsonResponse(422, { error: 'no_puede_modificarse_a_si_mismo' }));

    await expect(updateUser(1, { activo: false })).rejects.toThrow('no_puede_modificarse_a_si_mismo');
  });
});
