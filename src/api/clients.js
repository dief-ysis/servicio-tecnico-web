import { apiFetch } from '../lib/api';

async function parseOrThrow(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'error_desconocido');
  return data;
}

export async function getClients({ q, limit, offset } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (limit !== undefined) params.set('limit', limit);
  if (offset !== undefined) params.set('offset', offset);
  const res = await apiFetch(`/clientes?${params.toString()}`);
  return parseOrThrow(res);
}

export async function createClient(payload) {
  const res = await apiFetch('/clientes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseOrThrow(res);
}

export async function updateClient(id, payload) {
  const res = await apiFetch(`/clientes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return parseOrThrow(res);
}
