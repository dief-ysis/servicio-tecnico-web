import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorBanner } from '../components/ui/ErrorBanner';

const ERROR_MESSAGES = {
  contrasena_incorrecta: 'La contraseña actual no es correcta.',
  demasiados_intentos: 'Demasiados intentos. Espera unos minutos.',
};

export function ChangePasswordPage() {
  const { refreshUsuario } = useAuth();
  const navigate = useNavigate();
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ contrasenaActual, contrasenaNueva }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'error_desconocido');
      }
      await refreshUsuario();
      navigate('/');
    } catch (err) {
      setError(ERROR_MESSAGES[err.message] || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs bg-ink-900 p-6 rounded-lg border border-ink-700">
        <h1 className="text-white text-base font-bold">Debes cambiar tu contraseña</h1>
        <p className="text-ink-500 text-xs">Tu contraseña actual es temporal. Elige una nueva antes de continuar.</p>
        <Input id="actual" label="Contraseña actual" type="password" value={contrasenaActual} onChange={(e) => setContrasenaActual(e.target.value)} required />
        <Input id="nueva" label="Nueva contraseña" type="password" value={contrasenaNueva} onChange={(e) => setContrasenaNueva(e.target.value)} required />
        <ErrorBanner message={error} />
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar y continuar'}</Button>
      </form>
    </div>
  );
}
