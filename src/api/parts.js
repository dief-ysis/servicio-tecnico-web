import { apiFetch } from '../lib/api';

async function parseOrThrow(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'error_desconocido');
  return data;
}

export async function getParts({ buscar, incluirInactivos } = {}) {
  const params = new URLSearchParams();
  if (buscar) params.set('buscar', buscar);
  if (incluirInactivos) params.set('incluirInactivos', 'true');
  const qs = params.toString();
  const res = await apiFetch(`/repuestos${qs ? `?${qs}` : ''}`);
  return parseOrThrow(res);
}

export async function getLowStockAlerts() {
  const res = await apiFetch('/repuestos/alertas');
  return parseOrThrow(res);
}

export async function createPart(payload) {
  const res = await apiFetch('/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseOrThrow(res);
}

export async function updatePart(id, payload) {
  const res = await apiFetch(`/repuestos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return parseOrThrow(res);
}

export async function adjustStock(id, { ajusteStock }) {
  const res = await apiFetch(`/repuestos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ajusteStock }),
  });
  return parseOrThrow(res);
}
