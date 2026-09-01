const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const REFRESH_TOKEN_KEY = 'stls_refresh_token';

let accessToken = null;
let onSessionExpired = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

let refreshInFlight = null;

export async function refreshSession() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function buildRequestInit(options) {
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  };
}

// El backend usa 401 tanto para "tu token no sirve" (token_invalido /
// token_requerido, del middleware authenticate) como para errores de negocio
// (contrasena_incorrecta en PATCH /auth/password, credenciales_invalidas en
// login, etc.). Solo los primeros deben disparar refresh + reintento: reintentar
// un error de negocio reenvía la request y hace que el backend cuente el intento
// fallido dos veces (ver PATCH /auth/password, que lleva su propio rate limit).
const TOKEN_ERROR_CODES = ['token_invalido', 'token_requerido'];

async function esErrorDeToken(res) {
  try {
    const data = await res.clone().json();
    return TOKEN_ERROR_CODES.includes(data?.error);
  } catch {
    // 401 sin cuerpo JSON (proxy, gateway): no podemos distinguir, así que
    // conservamos el comportamiento previo e intentamos refrescar.
    return true;
  }
}

export async function apiFetch(path, options = {}) {
  const hadToken = Boolean(accessToken);
  const doFetch = () => fetch(`${API_URL}${path}`, buildRequestInit(options));

  let res = await doFetch();

  if (res.status === 401 && hadToken && (await esErrorDeToken(res))) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await doFetch();
    } else {
      setAccessToken(null);
      setRefreshToken(null);
      onSessionExpired();
    }
  }

  return res;
}
