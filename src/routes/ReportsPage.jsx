import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTiempoTaller, getPendientes, getSinRetiro } from '../api/reports';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { Badge } from '../components/ui/Badge';
import { EstadoBars } from '../components/reports/EstadoBars';
import { StatTile } from '../components/reports/StatTile';
import { ESTADO_LABELS, ESTADO_BADGE_VARIANT } from '../lib/equipmentStates';

const ERRORES_RANGO = {
  fecha_invalida: 'Alguna de las fechas no es válida.',
  rango_invalido: 'La fecha de inicio no puede ser posterior a la de término.',
};

function formatFecha(iso) {
  return iso ? new Date(iso).toLocaleDateString('es-CL') : '—';
}

function formatHoras(horas) {
  return `${horas.toLocaleString('es-CL', { maximumFractionDigits: 1 })} h`;
}

export function ReportsPage() {
  const [desdeInput, setDesdeInput] = useState('');
  const [hastaInput, setHastaInput] = useState('');
  // El rango aplicado es distinto del tecleado: la consulta solo se rehace al
  // apretar "Aplicar", no con cada tecla.
  const [rango, setRango] = useState({});
  const [errorRango, setErrorRango] = useState('');

  // Tres queries independientes a propósito: si una falla, las otras dos se
  // siguen viendo. Un solo query combinado dejaría la página vacía por el
  // fallo de cualquiera.
  const tiempo = useQuery({ queryKey: ['reportes', 'tiempo-taller', rango], queryFn: () => getTiempoTaller(rango) });
  const pendientes = useQuery({ queryKey: ['reportes', 'pendientes'], queryFn: getPendientes });
  const sinRetiro = useQuery({ queryKey: ['reportes', 'sin-retiro'], queryFn: getSinRetiro });

  function aplicarRango(e) {
    e.preventDefault();
    setErrorRango('');
    if (desdeInput && hastaInput && desdeInput > hastaInput) {
      setErrorRango(ERRORES_RANGO.rango_invalido);
      return;
    }
    setRango({ ...(desdeInput && { desde: desdeInput }), ...(hastaInput && { hasta: hastaInput }) });
  }

  const errorTiempo = tiempo.isError
    ? ERRORES_RANGO[tiempo.error.message] || 'No se pudo cargar el reporte de tiempo en taller.'
    : '';

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-white text-lg font-bold">Reportes</h1>

      {/* --- Tiempo en taller --- */}
      <section className="flex flex-col gap-3">
        <h2 className="text-ink-500 text-xs uppercase font-semibold">Tiempo en taller</h2>

        <form onSubmit={aplicarRango} noValidate className="flex items-end gap-3">
          <Input id="desde" label="Desde" type="date" value={desdeInput} onChange={(e) => setDesdeInput(e.target.value)} />
          <Input id="hasta" label="Hasta" type="date" value={hastaInput} onChange={(e) => setHastaInput(e.target.value)} />
          <Button type="submit" variant="secondary">Aplicar</Button>
        </form>

        <ErrorBanner message={errorRango || errorTiempo} />

        {tiempo.data && (
          <>
            <StatTile
              label="Promedio desde que entra a reparación hasta que queda listo"
              valor={tiempo.data.promedioHoras == null ? null : formatHoras(tiempo.data.promedioHoras)}
              vacio="Sin equipos terminados en este período."
            />
            {tiempo.data.porEquipo.length > 0 && (
              <table className="w-full text-sm text-left mt-2">
                <thead>
                  <tr className="text-ink-500 text-xs uppercase">
                    <th className="py-2 font-semibold">Equipo</th>
                    <th className="font-semibold">Horas</th>
                    <th className="font-semibold">Listo para retiro</th>
                  </tr>
                </thead>
                <tbody>
                  {tiempo.data.porEquipo.map((e) => (
                    <tr key={e.idInterno} className="border-t border-ink-700">
                      <td className="py-2 text-white">{e.idInterno}</td>
                      <td className="text-ink-500 tabular-nums">{formatHoras(e.horas)}</td>
                      <td className="text-ink-500">{formatFecha(e.fechas?.listoRetiro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>

      {/* --- Pendientes por estado --- */}
      <section className="flex flex-col gap-3">
        <h2 className="text-ink-500 text-xs uppercase font-semibold">Equipos pendientes por estado</h2>
        {pendientes.isError && <ErrorBanner message="No se pudo cargar el reporte de pendientes." />}
        {pendientes.data && (
          <>
            <EstadoBars datos={pendientes.data.porEstado} />
            {pendientes.data.equipos.length > 0 && (
              <table className="w-full text-sm text-left mt-2">
                <thead>
                  <tr className="text-ink-500 text-xs uppercase">
                    <th className="py-2 font-semibold">Equipo</th>
                    <th className="font-semibold">Cliente</th>
                    <th className="font-semibold">Estado</th>
                    <th className="font-semibold">Técnico</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.data.equipos.map((e) => (
                    <tr key={e.id} className="border-t border-ink-700">
                      <td className="py-2 text-white">{e.idInterno}</td>
                      <td className="text-ink-500">{e.clienteNombre}</td>
                      <td>
                        <Badge variant={ESTADO_BADGE_VARIANT[e.estado]}>
                          {ESTADO_LABELS[e.estado] || e.estado}
                        </Badge>
                      </td>
                      <td className="text-ink-500">{e.tecnicoNombre || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>

      {/* --- Sin retiro (RN-09) --- */}
      <section className="flex flex-col gap-3">
        <h2 className="text-ink-500 text-xs uppercase font-semibold">Sin retirar hace más de 30 días</h2>
        {sinRetiro.isError && <ErrorBanner message="No se pudo cargar el reporte de equipos sin retiro." />}
        {sinRetiro.data && (
          sinRetiro.data.length === 0 ? (
            <p className="text-ink-500 text-sm">No hay equipos sin retirar.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-ink-500 text-xs uppercase">
                  <th className="py-2 font-semibold">Equipo</th>
                  <th className="font-semibold">Cliente</th>
                  <th className="font-semibold">Listo desde</th>
                  <th className="font-semibold">Días</th>
                </tr>
              </thead>
              <tbody>
                {sinRetiro.data.map((e) => (
                  <tr key={e.idInterno} className="border-t border-ink-700">
                    <td className="py-2 text-white">{e.idInterno}</td>
                    <td className="text-ink-500">{e.cliente}</td>
                    <td className="text-ink-500">{formatFecha(e.fechaListoRetiro)}</td>
                    <td className="text-white tabular-nums">{e.diasTranscurridos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </section>
    </div>
  );
}
