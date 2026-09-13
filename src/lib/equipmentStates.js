// Espejo manual de TRANSITIONS en servicio-tecnico-api/src/equipment/service.js.
// Si el backend cambia ese mapa, actualizar acá también.
export const TRANSITIONS = {
  RECIBIDO: ['EN_DIAGNOSTICO'],
  EN_DIAGNOSTICO: ['EN_REPARACION', 'NO_REPARABLE'],
  EN_REPARACION: ['EN_PRUEBAS', 'NO_REPARABLE'],
  // Si el equipo no pasa la prueba, vuelve al banco: es el caso normal de que
  // la prueba sirva para algo.
  EN_PRUEBAS: ['LISTO_PARA_RETIRO', 'EN_REPARACION'],
  ESPERANDO_APROBACION: ['EN_REPARACION', 'NO_REPARABLE'],
  LISTO_PARA_RETIRO: ['ENTREGADO'],
  // Un equipo no reparable (o con el presupuesto rechazado) igual se le
  // devuelve al cliente. Sin esta salida quedaba para siempre entre los
  // pendientes y visible en la consulta pública del cliente.
  NO_REPARABLE: ['ENTREGADO'],
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
