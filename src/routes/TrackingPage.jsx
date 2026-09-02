import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { consultarSeguimiento } from '../api/tracking';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { TrackedEquipmentCard } from '../components/tracking/TrackedEquipmentCard';

// El backend responde 200 {equipos: []} de forma deliberadamente
// indistinguible para tres casos: código inexistente, código rotado y código
// válido sin equipos en proceso (anti-enumeración, RN-05). Este mensaje único
// preserva esa protección desde la UI: decir "código inválido" revelaría
// justo lo que el backend se esfuerza en ocultar.
const SIN_RESULTADOS =
  'No encontramos equipos en proceso con ese código. Si acabas de dejar tu equipo o ya lo retiraste, consulta directamente con el taller.';

const ERRORES = {
  demasiados_intentos: 'Demasiadas consultas seguidas. Espera unos minutos e intenta de nuevo.',
  fallo_red: 'No pudimos conectar con el taller. Revisa tu conexión e intenta de nuevo.',
};

export function TrackingPage() {
  const { codigo: codigoUrl } = useParams();
  const navigate = useNavigate();

  const [codigo, setCodigo] = useState(codigoUrl || '');
  const [equipos, setEquipos] = useState(null); // null = todavía no se consultó
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Entrar por /seguimiento/:codigo consulta sin que el cliente tenga que
  // hacer nada: el link del comprobante debe funcionar de una.
  useEffect(() => {
    if (!codigoUrl) return;
    let vigente = true;
    setCodigo(codigoUrl);
    setCargando(true);
    setError('');

    (async () => {
      try {
        const data = await consultarSeguimiento(codigoUrl);
        if (vigente) setEquipos(data.equipos || []);
      } catch (err) {
        if (!vigente) return;
        setEquipos(null);
        setError(ERRORES[err.message] || 'No pudimos completar la consulta. Intenta de nuevo.');
      } finally {
        if (vigente) setCargando(false);
      }
    })();

    return () => { vigente = false; };
  }, [codigoUrl]);

  function handleSubmit(e) {
    e.preventDefault();
    const limpio = codigo.trim();
    if (!limpio) return;
    // Navegar en vez de consultar acá deja la URL compartible y hace que el
    // efecto de arriba sea el único lugar que consulta.
    navigate(`/seguimiento/${encodeURIComponent(limpio)}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-ink-950 px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff3b0,#ffcd0d_55%,#b38f00_100%)] shadow-[0_0_24px_5px_rgba(255,205,13,0.4)]" />
          <h1 className="text-white text-lg font-extrabold tracking-wide">
            LIGHT <span className="text-gold">SOLUTION</span>
          </h1>
          <p className="text-ink-500 text-xs tracking-[2px] uppercase -mt-1">Estado de tu equipo</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <Input
            id="codigo-seguimiento"
            label="Código de seguimiento"
            placeholder="El código que aparece en tu comprobante"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <Button type="submit" disabled={cargando}>
            {cargando ? 'Consultando...' : 'Consultar'}
          </Button>
        </form>

        <ErrorBanner message={error} />

        {equipos !== null && equipos.length === 0 && !error && (
          <p className="text-ink-500 text-sm text-center">{SIN_RESULTADOS}</p>
        )}

        {equipos !== null && equipos.length > 0 && (
          <div className="flex flex-col gap-3">
            {equipos.map((equipo) => (
              <TrackedEquipmentCard key={equipo.idInterno} equipo={equipo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
