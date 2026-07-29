import { apiFetch } from '../lib/api';

async function parseOrThrow(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'error_desconocido');
  return data;
}

export async function getOrders({ clienteId, limit, offset } = {}) {
  const params = new URLSearchParams();
  if (clienteId !== undefined && clienteId !== null) params.set('cliente_id', clienteId);
  if (limit !== undefined) params.set('limit', limit);
  if (offset !== undefined) params.set('offset', offset);
  const res = await apiFetch(`/ordenes?${params.toString()}`);
  return parseOrThrow(res);
}

export async function getOrder(id) {
  const res = await apiFetch(`/ordenes/${id}`);
  return parseOrThrow(res);
}

export async function createOrder(payload) {
  const res = await apiFetch('/ordenes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseOrThrow(res);
}

export async function getReceiptBlob(id) {
  const res = await apiFetch(`/ordenes/${id}/comprobante`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'error_desconocido');
  }
  return res.blob();
}
