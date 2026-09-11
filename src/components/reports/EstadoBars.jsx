import { ESTADO_LABELS } from '../../lib/equipmentStates';

// Barras horizontales de UNA sola serie (cantidad de equipos por estado).
//
// Un solo color para todas, a propósito: la categoría ya está en la etiqueta y
// la magnitud en el largo de la barra. Pintar cada una distinto duplicaría en
// color lo que la barra ya dice y gastaría el único canal libre.
//
// El tono es gold-dark (#b38f00) y no el gold del tema: el gold puro queda
// fuera de la banda de luminosidad para fondo oscuro (OKLCH L=0.867) y como
// área rellena grande sobre casi-negro deslumbra. gold-dark pasa el validador.
//
// Horizontales porque los nombres de estado son largos ("Esperando aprobación").
// Sin ejes ni grillas: cada barra lleva su valor como etiqueta directa.
export function EstadoBars({ datos }) {
  if (!datos || datos.length === 0) {
    return <p className="text-ink-500 text-sm">No hay equipos pendientes.</p>;
  }

  const maximo = Math.max(...datos.map((d) => d.total), 0);

  return (
    // gap-1 (4px) deja los 2px de separación entre barras adyacentes que pide
    // el spec, con la superficie haciendo de separador.
    <ul className="flex flex-col gap-1">
      {datos.map(({ estado, total }) => (
        <li key={estado} className="flex items-center gap-3">
          <span className="text-ink-500 text-xs w-40 shrink-0 text-right">
            {ESTADO_LABELS[estado] || estado}
          </span>
          {/* Riel sin llenar: un paso adyacente a la superficie, recesivo. */}
          <span className="flex-1 h-3 bg-ink-800 rounded-sm overflow-hidden">
            <span
              data-testid="barra-relleno"
              // Extremo de dato redondeado, cuadrado en la línea base.
              className="block h-full bg-[#b38f00] rounded-r-[4px]"
              style={{ width: maximo > 0 ? `${(total / maximo) * 100}%` : '0%' }}
            />
          </span>
          {/* El número va en token de texto, nunca en el color de la serie. */}
          <span className="text-white text-sm w-8 shrink-0 tabular-nums">{total}</span>
        </li>
      ))}
    </ul>
  );
}
