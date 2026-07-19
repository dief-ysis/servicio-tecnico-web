import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChangePasswordPage } from './ChangePasswordPage';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
}));

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    useAuth.mockReset();
    apiFetch.mockReset();
  });

  test('cambio exitoso refresca el usuario', async () => {
    const refreshUsuario = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ refreshUsuario });
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<MemoryRouter><ChangePasswordPage /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'temp123');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'NuevaSegura456!');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(refreshUsuario).toHaveBeenCalled());
  });

  test('contraseña actual incorrecta muestra error', async () => {
    useAuth.mockReturnValue({ refreshUsuario: vi.fn() });
    apiFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'contrasena_incorrecta' }) });

    render(<MemoryRouter><ChangePasswordPage /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'mala');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'NuevaSegura456!');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('La contraseña actual no es correcta.')).toBeInTheDocument();
  });
});
