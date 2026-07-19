import { useAuth } from '../contexts/AuthContext';

export function HomePage() {
  const { usuario } = useAuth();
  return (
    <div>
      <h1 className="text-white text-lg font-bold">Hola, {usuario.nombre}</h1>
      <p className="text-ink-500 text-sm mt-1">Bienvenido al sistema de servicio técnico.</p>
    </div>
  );
}
