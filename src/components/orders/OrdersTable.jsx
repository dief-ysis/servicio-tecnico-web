import { Link } from 'react-router-dom';

function formatFecha(fechaIso) {
  return new Date(fechaIso).toLocaleDateString('es-CL');
}

export function OrdersTable({ ordenes }) {
  if (ordenes.length === 0) {
    return <p className="text-ink-500 text-sm">Sin resultados.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="text-ink-500 text-xs uppercase">
          <th className="py-2 font-semibold">Fecha ingreso</th>
          <th className="font-semibold">Cliente</th>
          <th className="font-semibold">Equipos</th>
        </tr>
      </thead>
      <tbody>
        {ordenes.map((orden) => (
          <tr key={orden.id} className="border-t border-ink-700">
            <td className="py-2 text-white">{formatFecha(orden.fechaIngreso)}</td>
            <td className="text-white">
              <Link to={`/ordenes/${orden.id}`} className="hover:underline hover:text-gold">
                {orden.cliente.nombre || orden.cliente.empresa}
              </Link>
            </td>
            <td className="text-ink-500">{orden.totalEquipos}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
