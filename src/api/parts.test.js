import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getParts, getLowStockAlerts, createPart, updatePart, adjustStock } from './parts';
import { apiFetch } from '../lib/api';

vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
}));

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('parts api', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  test('getParts pide /repuestos y devuelve el catálogo', async () => {
    const repuestos = [{ id: 1, nombre: 'Fusible 5A', codigoSku: null, stockActual: 12, stockMinimo: 2, activo: true }];
    apiFetch.mockResolvedValue(jsonResponse(200, repuestos));

    const result = await getParts();

    expect(apiFetch).toHaveBeenCalledWith('/repuestos');
    expect(result).toEqual(repuestos);
  });

  test('getParts lanza un Error si el backend responde con error', async () => {
    apiFetch.mockResolvedValue(jsonResponse(401, { error: 'no_autenticado' }));

    await expect(getParts()).rejects.toThrow('no_autenticado');
  });

  test('getParts arma el query string con buscar e incluirInactivos', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, []));

    await getParts({ buscar: 'fusible', incluirInactivos: true });

    expect(apiFetch).toHaveBeenCalledWith('/repuestos?buscar=fusible&incluirInactivos=true');
  });

  test('getParts sin filtros pide /repuestos sin query params', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, []));

    await getParts({});

    expect(apiFetch).toHaveBeenCalledWith('/repuestos');
  });

  test('getLowStockAlerts pide /repuestos/alertas', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, []));

    await getLowStockAlerts();

    expect(apiFetch).toHaveBeenCalledWith('/repuestos/alertas');
  });

  test('createPart hace POST con los campos del repuesto', async () => {
    apiFetch.mockResolvedValue(jsonResponse(201, { id: 1 }));

    await createPart({ nombre: 'Fusible 5A', codigoSku: 'F5A', stockActual: 10, stockMinimo: 2 });

    expect(apiFetch).toHaveBeenCalledWith('/repuestos', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Fusible 5A', codigoSku: 'F5A', stockActual: 10, stockMinimo: 2 }),
    });
  });

  test('createPart lanza un Error con el código del backend si falla', async () => {
    apiFetch.mockResolvedValue(jsonResponse(409, { error: 'codigo_sku_en_uso' }));

    await expect(createPart({ nombre: 'X', stockActual: 1, stockMinimo: 0 })).rejects.toThrow('codigo_sku_en_uso');
  });

  test('updatePart hace PATCH con los campos provistos', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { id: 1 }));

    await updatePart(1, { stockMinimo: 5 });

    expect(apiFetch).toHaveBeenCalledWith('/repuestos/1', {
      method: 'PATCH',
      body: JSON.stringify({ stockMinimo: 5 }),
    });
  });

  test('adjustStock hace PATCH solo con ajusteStock', async () => {
    apiFetch.mockResolvedValue(jsonResponse(200, { id: 1, stockActual: 8 }));

    await adjustStock(1, { ajusteStock: -2 });

    expect(apiFetch).toHaveBeenCalledWith('/repuestos/1', {
      method: 'PATCH',
      body: JSON.stringify({ ajusteStock: -2 }),
    });
  });

  test('adjustStock lanza un Error con el código del backend si falla', async () => {
    apiFetch.mockResolvedValue(jsonResponse(409, { error: 'stock_insuficiente' }));

    await expect(adjustStock(1, { ajusteStock: -100 })).rejects.toThrow('stock_insuficiente');
  });
});
