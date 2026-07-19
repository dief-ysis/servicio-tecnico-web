import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorBanner } from '../components/ui/ErrorBanner';

const ERROR_MESSAGES = {
  credenciales_invalidas: 'Usuario o contraseña incorrectos.',
  cuenta_desactivada: 'Esta cuenta está desactivada.',
  demasiados_intentos: 'Demasiados intentos. Espera unos minutos.',
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(identificador, contrasena);
      navigate(data.mustChangePassword ? '/cambiar-password' : '/');
    } catch (err) {
      setError(ERROR_MESSAGES[err.message] || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_50%_30%,#1a1a1a_0%,#050505_70%)]">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-xs">
        <div className="w-14 h-14 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff3b0,#ffcd0d_55%,#b38f00_100%)] shadow-[0_0_30px_6px_rgba(255,205,13,0.45)]" />
        <h1 className="text-white text-lg font-extrabold tracking-wide">
          LIGHT <span className="text-gold">SOLUTION</span>
        </h1>
        <p className="text-ink-500 text-xs tracking-[2px] uppercase -mt-2">Servicio Técnico</p>
        <div className="w-full flex flex-col gap-3 mt-2">
          <Input
            id="identificador"
            label="Usuario"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            id="contrasena"
            label="Contraseña"
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password"
            required
          />
          <ErrorBanner message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
