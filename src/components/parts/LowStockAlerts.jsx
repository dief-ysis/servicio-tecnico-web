import { useQuery } from '@tanstack/react-query';
import { getLowStockAlerts } from '../../api/parts';

export function LowStockAlerts() {
  const { data } = useQuery({
    queryKey: ['repuestos-alertas'],
    queryFn: getLowStockAlerts,
  });

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
