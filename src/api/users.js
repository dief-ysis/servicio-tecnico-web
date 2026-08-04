import { apiFetch } from '../lib/api';

export async function getUsers() {
  const res = await apiFetch('/usuarios');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'error_desconocido');
  return data;
}
