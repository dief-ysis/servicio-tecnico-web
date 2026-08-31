import { apiFetch } from '../lib/api';

export async function getParts() {
  const res = await apiFetch('/repuestos');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'error_desconocido');
  return data;
}
