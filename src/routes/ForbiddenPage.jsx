import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-ink-950 text-center px-4">
      <h1 className="text-white text-xl font-bold">Sin permiso</h1>
      <p className="text-ink-500 text-sm max-w-sm">No tienes acceso a esta sección con tu rol actual.</p>
      <Link to="/" className="text-gold text-sm font-semibold hover:underline">Volver al inicio</Link>
    </div>
  );
}
