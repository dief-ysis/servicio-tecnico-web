// src/api/equipment.test.js
import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  getEquipment,
  getEquipmentById,
  updateEquipmentState,
  assignTechnician,
  submitBudget,
  getPartUsage,
  registerPartUsage,
  reversePartUsage,
} from './equipment';
import { apiFetch } from '../lib/api';

vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
}));

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('equipment api', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  test('getEquipment arma el query string con buscar, estado y tecnico', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, []));

    await getEquipment({ buscar: 'dmx', estado: 'EN_DIAGNOSTICO', tecnico: 3 });

    expect(apiFetch).toHaveBeenCalledWith('/equipos?buscar=dmx&estado=EN_DIAGNOSTICO&tecnico=3');
  });

  test('getEquipment sin filtros pide /equipos sin query params', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, []));

    await getEquipment();

    expect(apiFetch).toHaveBeenCalledWith('/equipos?');
  });

  test('getEquipmentById pide /equipos/:id', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { id: 5 }));

    await getEquipmentById(5);

    expect(apiFetch).toHaveBeenCalledWith('/equipos/5');
  });

  test('updateEquipmentState hace PATCH con estado y motivo', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { id: 5, estado: 'EN_REPARACION' }));

    await updateEquipmentState(5, { estado: 'EN_REPARACION', motivo: undefined });

    expect(apiFetch).toHaveBeenCalledWith('/equipos/5/estado', {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'EN_REPARACION', motivo: undefined }),
    });
  });

  test('updateEquipmentState lanza un Error con el código del backend si falla', async () => {
    apiFetch.mockResolvedValue(jsonResponse(422, { error: 'transicion_no_permitida' }));

    await expect(updateEquipmentState(5, { estado: 'ENTREGADO' })).rejects.toThrow('transicion_no_permitida');
  });

  test('assignTechnician hace PATCH con tecnicoId', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { id: 5, tecnicoAsignadoId: 2 }));

    await assignTechnician(5, { tecnicoId: 2 });

    expect(apiFetch).toHaveBeenCalledWith('/equipos/5/tecnico', {
      method: 'PATCH',
      body: JSON.stringify({ tecnicoId: 2 }),
    });
  });

  test('submitBudget hace PATCH con monto y descripcion', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { id: 5, estado: 'ESPERANDO_APROBACION' }));

    await submitBudget(5, { monto: 15000, descripcion: 'Cambio de fuente' });

    expect(apiFetch).toHaveBeenCalledWith('/equipos/5/presupuesto', {
      method: 'PATCH',
      body: JSON.stringify({ monto: 15000, descripcion: 'Cambio de fuente' }),
    });
  });

  test('getPartUsage pide /equipos/:id/repuestos', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, []));

    await getPartUsage(5);

    expect(apiFetch).toHaveBeenCalledWith('/equipos/5/repuestos');
  });

  test('registerPartUsage hace POST con repuestoId y cantidad', async () => {
    apiFetch.mockResolvedValue(jsonResponse(201, { id: 1, repuestoId: 3, cantidad: 2, stockRestante: 8 }));

    await registerPartUsage(5, { repuestoId: 3, cantidad: 2 });

    expect(apiFetch).toHaveBeenCalledWith('/equipos/5/repuestos', {
      method: 'POST',
      body: JSON.stringify({ repuestoId: 3, cantidad: 2 }),
    });
  });

  test('registerPartUsage lanza un Error con el código del backend si falla', async () => {
    apiFetch.mockResolvedValue(jsonResponse(409, { error: 'stock_insuficiente' }));

    await expect(registerPartUsage(5, { repuestoId: 3, cantidad: 100 })).rejects.toThrow('stock_insuficiente');
  });

  test('reversePartUsage hace POST con motivo', async () => {
    apiFetch.mockResolvedValue(jsonResponse(201, { id: 2, tipo: 'REVERSION' }));

    await reversePartUsage(5, 1, { motivo: 'Repuesto no se usó' });

    expect(apiFetch).toHaveBeenCalledWith('/equipos/5/repuestos/1/reversion', {
      method: 'POST',
      body: JSON.stringify({ motivo: 'Repuesto no se usó' }),
    });
  });

  test('reversePartUsage lanza un Error con el código del backend si falla', async () => {
    apiFetch.mockResolvedValue(jsonResponse(409, { error: 'ya_revertido' }));

    await expect(reversePartUsage(5, 1, { motivo: 'x' })).rejects.toThrow('ya_revertido');
  });
});
