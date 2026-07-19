import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('LoginPage', () => {
  beforeEach(() => {
    useAuth.mockReset();
    mockNavigate.mockClear();
  });

  test('login exitoso sin mustChangePassword navega a /', async () => {
    const login = vi.fn().mockResolvedValue({ mustChangePassword: false });
    useAuth.mockReturnValue({ login, usuario: null });

    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText('Usuario'), 'ana');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('ana', 'Password123!'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  test('login con mustChangePassword=true navega a /cambiar-password', async () => {
    const login = vi.fn().mockResolvedValue({ mustChangePassword: true });
    useAuth.mockReturnValue({ login, usuario: null });

    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText('Usuario'), 'ana');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'temp');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => expect(login).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/cambiar-password'));
  });

  test('credenciales inválidas muestra un mensaje de error sin romper el formulario', async () => {
    const login = vi.fn().mockRejectedValue(new Error('credenciales_invalidas'));
    useAuth.mockReturnValue({ login, usuario: null });

    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText('Usuario'), 'ana');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(await screen.findByText('Usuario o contraseña incorrectos.')).toBeInTheDocument();
  });
});
