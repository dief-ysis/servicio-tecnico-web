import { Badge } from '../ui/Badge';
import { ESTADO_LABELS, ESTADO_BADGE_VARIANT } from '../../lib/equipmentStates';

function formatFecha(fechaIso) {
  return fechaIso ? new Date(fechaIso).toLocaleDateString('es-CL') : '—';
}

export function TrackedEquipmentCard({ equipo }) {
  const notas = equipo.notas || [];

  return (
    <div className="border border-ink-700 rounded-md p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-white font-semibold">{equipo.idInterno}</span>
        <Badge variant={ESTADO_BADGE_VARIANT[equipo.estado]}>
          {ESTADO_LABELS[equipo.estado] || equipo.estado}
        </Badge>
      </div>
      <p className="text-ink-500 text-xs">
        Última actualización: {formatFecha(equipo.fechaUltimoCambio)}
      </p>

      {notas.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-ink-700 pt-2">
          {notas.map((nota, i) => (
            <p key={i} data-testid="nota" className="text-sm text-white">
              <span className="text-ink-500 text-xs">{formatFecha(nota.fecha)} · </span>
              {nota.texto}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
