import { apiFetch } from '../lib/api';

async function parseOrThrow(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'error_desconocido');
  return data;
}

export async function getUsers() {
  const res = await apiFetch('/usuarios');
  return parseOrThrow(res);
}

// Devuelve {usuario, contrasenaTemp}. La contraseña temporal viaja una sola
// vez: el backend la guarda hasheada y no hay endpoint para recuperarla.
export async function createUser(payload) {
  const res = await apiFetch('/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseOrThrow(res);
}

export async function updateUser(id, payload) {
  const res = await apiFetch(`/usuarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return parseOrThrow(res);
}
