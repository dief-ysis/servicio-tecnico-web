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

  // Las dos mitades del nombre. La segunda es la que atrapa una resincronización
  // futura que borre por accidente una entrada del mapa: el estado se volvería
  // terminal en silencio (la UI diría "Sin transiciones disponibles" y el equipo
  // no se podría mover nunca más) con la suite igual de verde.
  test('ENTREGADO es el único estado terminal', () => {
    expect(getNextEstados('ENTREGADO')).toEqual([]);

    const sinSalida = ESTADOS
      .filter((estado) => estado !== 'ENTREGADO')
      .filter((estado) => getNextEstados(estado).length === 0);
    expect(sinSalida).toEqual([]);
  });

  // El equipo no reparable no se queda en el taller: se le devuelve al cliente.
  test('desde NO_REPARABLE se puede entregar el equipo sin reparar', () => {
    expect(getNextEstados('NO_REPARABLE')).toEqual(['ENTREGADO']);
  });

  // La prueba existe para detectar que la reparación no quedó; si no se puede
  // volver a EN_REPARACION, el único camino sería darla por buena igual.
  test('desde EN_PRUEBAS se puede volver al banco además de dar por listo', () => {
    expect(getNextEstados('EN_PRUEBAS')).toEqual(['LISTO_PARA_RETIRO', 'EN_REPARACION']);
  });

  test('ESTADO_LABELS y ESTADO_BADGE_VARIANT tienen una entrada para cada estado', () => {
    ESTADOS.forEach((estado) => {
      expect(ESTADO_LABELS[estado]).toBeTruthy();
      expect(ESTADO_BADGE_VARIANT[estado]).toBeTruthy();
    });
  });
});
