import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const MENU = [
  { to: '/clientes', label: 'Clientes', roles: ['RECEPCION', 'ADMIN'] },
  { to: '/ordenes', label: 'Órdenes', roles: ['RECEPCION', 'TECNICO', 'ADMIN'] },
  { to: '/equipos', label: 'Equipos', roles: ['TECNICO', 'ADMIN'] },
  { to: '/repuestos', label: 'Repuestos', roles: ['RECEPCION', 'TECNICO', 'ADMIN'] },
  { to: '/reportes', label: 'Reportes', roles: ['ADMIN'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['ADMIN'] },
];

export function Sidebar() {
  const { usuario, logout } = useAuth();
  const items = MENU.filter((item) => item.roles.includes(usuario.rol));

  return (
    <nav className="w-16 bg-ink-900 border-r border-ink-700 flex flex-col items-center py-4 gap-4">
      <div className="w-7 h-7 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff3b0,#ffcd0d_60%,#b38f00_100%)] shadow-[0_0_10px_1px_rgba(255,205,13,0.5)]" />
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={item.label}
          className={({ isActive }) =>
            `w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold uppercase ${
              isActive ? 'bg-gold/20 border border-gold text-gold' : 'bg-ink-800 text-ink-500 hover:text-gold'
            }`
          }
        >
          {item.label.slice(0, 2)}
        </NavLink>
      ))}
      <button
        type="button"
        title="Cerrar sesión"
        onClick={logout}
        className="mt-auto w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold uppercase bg-ink-800 text-ink-500 hover:text-gold"
      >
        SA
      </button>
    </nav>
  );
}
