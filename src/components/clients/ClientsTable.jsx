export function ClientsTable({ clientes, canEdit, onEdit }) {
  if (clientes.length === 0) {
    return <p className="text-ink-500 text-sm">Sin resultados.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="text-ink-500 text-xs uppercase">
          <th className="py-2 font-semibold">Nombre / Empresa</th>
          <th className="font-semibold">Teléfono</th>
          <th className="font-semibold">Correo</th>
          <th className="font-semibold">RUT</th>
          {canEdit && <th></th>}
        </tr>
      </thead>
      <tbody>
        {clientes.map((cliente) => (
          <tr key={cliente.id} className="border-t border-ink-700">
            <td className="py-2 text-white">{cliente.nombre || cliente.empresa}</td>
            <td className="text-ink-500">{cliente.telefono}</td>
            <td className="text-ink-500">{cliente.correo || '—'}</td>
            <td className="text-ink-500">{cliente.rut || '—'}</td>
            {canEdit && (
              <td>
                <button
                  type="button"
                  onClick={() => onEdit(cliente)}
                  className="text-gold text-xs font-semibold hover:underline"
                >
                  Editar
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
