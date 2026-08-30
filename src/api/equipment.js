import { apiFetch } from '../lib/api';

async function parseOrThrow(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'error_desconocido');
  return data;
}

export async function getEquipment({ buscar, estado, tecnico } = {}) {
  const params = new URLSearchParams();
  if (buscar) params.set('buscar', buscar);
  if (estado) params.set('estado', estado);
  if (tecnico !== undefined && tecnico !== null && tecnico !== '') params.set('tecnico', tecnico);
  const res = await apiFetch(`/equipos?${params.toString()}`);
  return parseOrThrow(res);
}

export async function getEquipmentById(id) {
  const res = await apiFetch(`/equipos/${id}`);
  return parseOrThrow(res);
}

export async function updateEquipmentState(id, { estado, motivo }) {
  const res = await apiFetch(`/equipos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado, motivo }),
  });
  return parseOrThrow(res);
}

export async function assignTechnician(id, { tecnicoId }) {
  const res = await apiFetch(`/equipos/${id}/tecnico`, {
    method: 'PATCH',
    body: JSON.stringify({ tecnicoId }),
  });
  return parseOrThrow(res);
}

export async function submitBudget(id, { monto, descripcion }) {
  const res = await apiFetch(`/equipos/${id}/presupuesto`, {
    method: 'PATCH',
    body: JSON.stringify({ monto, descripcion }),
  });
  return parseOrThrow(res);
}

export async function getPartUsage(id) {
  const res = await apiFetch(`/equipos/${id}/repuestos`);
  return parseOrThrow(res);
}

export async function registerPartUsage(id, { repuestoId, cantidad }) {
  const res = await apiFetch(`/equipos/${id}/repuestos`, {
    method: 'POST',
    body: JSON.stringify({ repuestoId, cantidad }),
  });
  return parseOrThrow(res);
}

export async function reversePartUsage(id, movimientoId, { motivo }) {
  const res = await apiFetch(`/equipos/${id}/repuestos/${movimientoId}/reversion`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  });
  return parseOrThrow(res);
}
