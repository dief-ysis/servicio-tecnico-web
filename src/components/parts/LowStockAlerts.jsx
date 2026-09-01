import { useQuery } from '@tanstack/react-query';
import { getLowStockAlerts } from '../../api/parts';
import { ErrorBanner } from '../ui/ErrorBanner';

export function LowStockAlerts() {
  const { data, isError } = useQuery({
    queryKey: ['repuestos-alertas'],
    queryFn: getLowStockAlerts,
  });

  // Un fallo no puede verse igual que "no hay stock bajo": el panel es el
  // corazón de CU-13, y desaparecer en silencio hace creer al usuario que
  // está todo bien cuando en realidad no se pudo consultar.
  if (isError) {
    return <ErrorBanner message="No se pudo cargar el estado de stock de los repuestos." />;
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="border border-red-800 bg-red-950/30 rounded-md p-3 flex flex-col gap-1">
      <p className="text-red-300 text-xs uppercase font-semibold">Stock bajo ({data.length})</p>
      {data.map((r) => (
        <p key={r.id} className="text-sm text-white">
          {r.nombre} — {r.stockActual} / mínimo {r.stockMinimo}
        </p>
      ))}
    </div>
  );
}
