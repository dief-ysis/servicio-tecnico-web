import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UsersPage } from './UsersPage';
import { getUsers, updateUser } from '../api/users';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../api/users', () => ({ getUsers: vi.fn(), updateUser: vi.fn(), createUser: vi.fn() }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../components/users/UserFormModal', () => ({
  UserFormModal: ({ usuario, onCreado }) => (
    <div data-testid="user-form-modal">
      {usuario ? `editar-${usuario.id}` : 'nuevo'}
      <button onClick={() => onCreado({ usuario: { id: 9, nombre: 'Ana' }, contrasenaTemp: 'a1b2c3d4' })}>
        simular-alta
      </button>
    </div>
  ),
}));

const USUARIOS = [
  { id: 1, nombre: 'Admin Uno', identificador_acceso: 'admin@taller.cl', rol: 'ADMIN', activo: true },
  { id: 2, nombre: 'Tec Dos', identificador_acceso: 'tec@taller.cl', rol: 'TECNICO', activo: true },
];

function renderPage() {
  useAuth.mockReturnValue({ usuario: { id: 1, rol: 'ADMIN' } });
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <UsersPage />
    </QueryClientProvider>
  );
}

describe('UsersPage', () => {
  test('lista los usuarios que devuelve getUsers', async () => {
    getUsers.mockResolvedValue(USUARIOS);
    renderPage();

    expect(await screen.findByText('Admin Uno')).toBeInTheDocument();
    expect(screen.getByText('Tec Dos')).toBeInTheDocument();
  });

  test('click en "Nuevo usuario" abre el modal en modo alta', async () => {
    getUsers.mockResolvedValue(USUARIOS);
    renderPage();
    await screen.findByText('Admin Uno');

    await userEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));
    expect(screen.getByTestId('user-form-modal')).toHaveTextContent('nuevo');
  });

  test('tras crear un usuario se muestra la contraseña temporal', async () => {
    getUsers.mockResolvedValue(USUARIOS);
    renderPage();
    await screen.findByText('Admin Uno');

    await userEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));
    await userEvent.click(screen.getByRole('button', { name: /simular-alta/i }));

    expect(await screen.findByText('a1b2c3d4')).toBeInTheDocument();
    expect(screen.getByText(/no se volverá a mostrar/i)).toBeInTheDocument();
  });

  test('desactivar a otro usuario llama a updateUser con activo:false', async () => {
    getUsers.mockResolvedValue(USUARIOS);
    updateUser.mockResolvedValue({ ...USUARIOS[1], activo: false });
    renderPage();
    await screen.findByText('Tec Dos');

    const fila = screen.getByText('Tec Dos').closest('tr');
    await userEvent.click([...fila.querySelectorAll('button')].find((b) => /desactivar/i.test(b.textContent)));

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(2, { activo: false }));
  });

  test('muestra ErrorBanner si getUsers falla', async () => {
    getUsers.mockImplementation(() => Promise.reject(new Error('fallo_red')));
    renderPage();

    expect(await screen.findByText(/no se pudo cargar la lista de usuarios/i)).toBeInTheDocument();
  });

  test('un error del backend al desactivar se muestra sin romper la página', async () => {
    getUsers.mockResolvedValue(USUARIOS);
    updateUser.mockImplementation(() => Promise.reject(new Error('no_puede_modificarse_a_si_mismo')));
    renderPage();
    await screen.findByText('Tec Dos');

    const fila = screen.getByText('Tec Dos').closest('tr');
    await userEvent.click([...fila.querySelectorAll('button')].find((b) => /desactivar/i.test(b.textContent)));

    expect(await screen.findByText(/no puedes cambiar tu propio rol/i)).toBeInTheDocument();
    expect(screen.getByText('Tec Dos')).toBeInTheDocument();
  });
});
