// Espejo manual de TRANSITIONS en servicio-tecnico-api/src/equipment/service.js:5-11.
// Si el backend cambia ese mapa, actualizar acá también.
export const TRANSITIONS = {
  RECIBIDO: ['EN_DIAGNOSTICO'],
  EN_DIAGNOSTICO: ['EN_REPARACION', 'NO_REPARABLE'],
  EN_REPARACION: ['EN_PRUEBAS', 'NO_REPARABLE'],
  EN_PRUEBAS: ['LISTO_PARA_RETIRO'],
  ESPERANDO_APROBACION: ['EN_REPARACION', 'NO_REPARABLE'],
  LISTO_PARA_RETIRO: ['ENTREGADO'],
};

export const ESTADO_LABELS = {
  RECIBIDO: 'Recibido',
  EN_DIAGNOSTICO: 'En diagnóstico',
  ESPERANDO_APROBACION: 'Esperando aprobación',
  EN_REPARACION: 'En reparación',
  EN_PRUEBAS: 'En pruebas',
  LISTO_PARA_RETIRO: 'Listo para retiro',
  ENTREGADO: 'Entregado',
  NO_REPARABLE: 'No reparable',
};

export const ESTADO_BADGE_VARIANT = {
  RECIBIDO: 'neutral',
  EN_DIAGNOSTICO: 'proceso',
  ESPERANDO_APROBACION: 'alerta',
  EN_REPARACION: 'proceso',
  EN_PRUEBAS: 'proceso',
  LISTO_PARA_RETIRO: 'listo',
  ENTREGADO: 'listo',
  NO_REPARABLE: 'alerta',
};

export function getNextEstados(estadoActual) {
  return TRANSITIONS[estadoActual] || [];
}
