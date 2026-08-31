import { describe, test, expect } from 'vitest';
import { getNextEstados, ESTADO_LABELS, ESTADO_BADGE_VARIANT } from './equipmentStates';

const ESTADOS = [
  'RECIBIDO', 'EN_DIAGNOSTICO', 'ESPERANDO_APROBACION', 'EN_REPARACION',
  'EN_PRUEBAS', 'LISTO_PARA_RETIRO', 'ENTREGADO', 'NO_REPARABLE',
];

describe('equipmentStates', () => {
  test('getNextEstados devuelve las transiciones válidas desde RECIBIDO', () => {
    expect(getNextEstados('RECIBIDO')).toEqual(['EN_DIAGNOSTICO']);
  });

  test('getNextEstados devuelve las transiciones válidas desde ESPERANDO_APROBACION', () => {
    expect(getNextEstados('ESPERANDO_APROBACION')).toEqual(['EN_REPARACION', 'NO_REPARABLE']);
  });

  test('getNextEstados devuelve un array vacío para un estado terminal', () => {
    expect(getNextEstados('ENTREGADO')).toEqual([]);
    expect(getNextEstados('NO_REPARABLE')).toEqual([]);
  });

  test('ESTADO_LABELS y ESTADO_BADGE_VARIANT tienen una entrada para cada estado', () => {
    ESTADOS.forEach((estado) => {
      expect(ESTADO_LABELS[estado]).toBeTruthy();
      expect(ESTADO_BADGE_VARIANT[estado]).toBeTruthy();
    });
  });
});
