import { Badge } from '../ui/Badge';

export function PartsTable({ repuestos, canWrite, onEdit, onAdjustStock }) {
  if (repuestos.length === 0) {
    return <p className="text-ink-500 text-sm">Sin resultados.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="text-ink-500 text-xs uppercase">
          <th className="py-2 font-semibold">Nombre</th>
          <th className="font-semibold">Código</th>
          <th className="font-semibold">Stock actual</th>
          <th className="font-semibold">Stock mínimo</th>
          <th className="font-semibold">Estado</th>
          {canWrite && <th></th>}
        </tr>
      </thead>
      <tbody>
        {repuestos.map((repuesto) => (
          <tr key={repuesto.id} className="border-t border-ink-700">
            <td className="py-2 text-white">{repuesto.nombre}</td>
            <td className="text-ink-500">{repuesto.codigoSku || '—'}</td>
            <td className="text-white">{repuesto.stockActual}</td>
            <td className="text-ink-500">{repuesto.stockMinimo}</td>
            <td>
              <Badge variant={repuesto.activo ? 'listo' : 'alerta'}>
                {repuesto.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </td>
            {canWrite && (
              <td>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(repuesto)}
                    className="text-gold text-xs font-semibold hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustStock(repuesto)}
                    className="text-gold text-xs font-semibold hover:underline"
                  >
                    Ajustar stock
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
