import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { ESTADO_LABELS, ESTADO_BADGE_VARIANT } from '../../lib/equipmentStates';

export function EquipmentsTable({ equipos }) {
  if (equipos.length === 0) {
    return <p className="text-ink-500 text-sm">Sin resultados.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="text-ink-500 text-xs uppercase">
          <th className="py-2 font-semibold">ID</th>
          <th className="font-semibold">Cliente</th>
          <th className="font-semibold">Tipo / modelo</th>
          <th className="font-semibold">Marca</th>
          <th className="font-semibold">Estado</th>
          <th className="font-semibold">Técnico</th>
        </tr>
      </thead>
      <tbody>
        {equipos.map((equipo) => (
          <tr key={equipo.id} className="border-t border-ink-700">
            <td className="py-2 text-white">
              <Link to={`/equipos/${equipo.id}`} className="hover:underline hover:text-gold">
                {equipo.idInterno}
              </Link>
            </td>
            <td className="text-white">{equipo.clienteNombre}</td>
            <td className="text-white">{equipo.tipoModelo}</td>
            <td className="text-ink-500">{equipo.marca || '—'}</td>
            <td>
              <Badge variant={ESTADO_BADGE_VARIANT[equipo.estado]}>
                {ESTADO_LABELS[equipo.estado] || equipo.estado}
              </Badge>
            </td>
            <td className="text-ink-500">{equipo.tecnicoNombre || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
