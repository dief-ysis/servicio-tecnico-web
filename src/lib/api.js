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

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

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

export async function apiFetch(path, options = {}) {
  const hadToken = Boolean(accessToken);
  const doFetch = () => fetch(`${API_URL}${path}`, buildRequestInit(options));

  let res = await doFetch();

  if (res.status === 401 && hadToken) {
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
