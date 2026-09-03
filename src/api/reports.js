import { apiFetch } from '../lib/api';

async function parseOrThrow(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'error_desconocido');
  return data;
}

export async function getTiempoTaller({ desde, hasta } = {}) {
  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  const qs = params.toString();
  const res = await apiFetch(`/reportes/tiempo-taller${qs ? `?${qs}` : ''}`);
  return parseOrThrow(res);
}

export async function getPendientes() {
  const res = await apiFetch('/reportes/pendientes');
  return parseOrThrow(res);
}

export async function getSinRetiro() {
  const res = await apiFetch('/reportes/sin-retiro');
  return parseOrThrow(res);
}
