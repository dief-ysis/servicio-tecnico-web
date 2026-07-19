import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { setAccessToken, setRefreshToken } from './lib/api';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
  });

  test('sin sesión, la ruta raíz termina mostrando el login', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Servicio Técnico')).toBeInTheDocument());
  });
});
