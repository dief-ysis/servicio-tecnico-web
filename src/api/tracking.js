const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// A propósito NO usa apiFetch: /seguimiento es la única ruta pública del
// sistema, y apiFetch adjunta el Authorization de quien esté logueado y pasa
// por el interceptor de refresh de sesión. Ninguna de las dos cosas
// corresponde acá — un cliente sin cuenta debe poder consultar, y las
// credenciales del personal no tienen por qué viajar a una ruta pública.
export async function consultarSeguimiento(codigo) {
  let res;
  try {
    res = await fetch(`${API_URL}/seguimiento/${encodeURIComponent(codigo)}`);
  } catch {
    throw new Error('fallo_red');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'error_desconocido');
  }
  return data;
}
