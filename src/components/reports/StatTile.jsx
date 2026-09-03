// Una cifra sola no se grafica: un gráfico de una barra es un anti-patrón.
// Va como cifra grande, la única de la vista.
export function StatTile({ label, valor, vacio }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-ink-500 text-xs uppercase font-semibold">{label}</p>
      {valor == null ? (
        <p className="text-ink-500 text-sm">{vacio}</p>
      ) : (
        // Figuras proporcionales (sin tabular-nums): a este tamaño, forzar el
        // ancho de cada dígito deja el número suelto.
        <p className="text-white text-5xl font-semibold">{valor}</p>
      )}
    </div>
  );
}
