import { Badge } from '../ui/Badge';

const ROL_VARIANT = {
  ADMIN: 'proceso',
  RECEPCION: 'neutral',
  TECNICO: 'neutral',
};

const MOTIVO_PROPIA = 'No puedes cambiar el rol ni desactivar tu propia cuenta.';

export function UsersTable({ usuarios, usuarioActualId, onEdit, onToggleActivo }) {
  if (usuarios.length === 0) {
    return <p className="text-ink-500 text-sm">Sin resultados.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="text-ink-500 text-xs uppercase">
          <th className="py-2 font-semibold">Nombre</th>
          <th className="font-semibold">Identificador</th>
          <th className="font-semibold">Rol</th>
          <th className="font-semibold">Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((usuario) => {
          // El backend rechaza con 422 que alguien cambie su propio rol o se
          // desactive (se dejaría fuera del sistema). La UI no lo ofrece.
          const esPropia = Number(usuario.id) === Number(usuarioActualId);
          const titulo = esPropia ? MOTIVO_PROPIA : undefined;

          return (
            <tr key={usuario.id} className="border-t border-ink-700">
              <td className="py-2 text-white">{usuario.nombre}</td>
              <td className="text-ink-500">{usuario.identificador_acceso}</td>
              <td>
                <Badge variant={ROL_VARIANT[usuario.rol] || 'neutral'}>{usuario.rol}</Badge>
              </td>
              <td>
                <Badge variant={usuario.activo ? 'listo' : 'alerta'}>
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
              <td>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(usuario)}
                    disabled={esPropia}
                    title={titulo}
                    className="text-gold text-xs font-semibold hover:underline disabled:opacity-30 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleActivo(usuario)}
                    disabled={esPropia}
                    title={titulo}
                    className="text-gold text-xs font-semibold hover:underline disabled:opacity-30 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    {usuario.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
