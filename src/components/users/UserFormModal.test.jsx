import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserFormModal } from './UserFormModal';
import { createUser, updateUser } from '../../api/users';

vi.mock('../../api/users', () => ({ createUser: vi.fn(), updateUser: vi.fn() }));

function renderModal(props) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <UserFormModal onClose={vi.fn()} onCreado={vi.fn()} {...props} />
    </QueryClientProvider>
  );
}

describe('UserFormModal', () => {
  test('alta: sin nombre muestra error sin llamar al backend', async () => {
    createUser.mockClear();
    renderModal({ usuario: null });

    await userEvent.type(screen.getByLabelText('Identificador'), 'x@taller.cl');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText(/nombre es requerido/i)).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  test('alta: sin identificador muestra error sin llamar al backend', async () => {
    createUser.mockClear();
    renderModal({ usuario: null });

    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText(/identificador es requerido/i)).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  test('alta: datos válidos crea y entrega la contraseña temporal al padre', async () => {
    const onCreado = vi.fn();
    createUser.mockResolvedValue({ usuario: { id: 9, nombre: 'Ana' }, contrasenaTemp: 'a1b2c3d4' });
    renderModal({ usuario: null, onCreado });

    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana');
    await userEvent.type(screen.getByLabelText('Identificador'), 'ana@taller.cl');
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'TECNICO');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(createUser).toHaveBeenCalledWith({
      nombre: 'Ana', identificador: 'ana@taller.cl', rol: 'TECNICO',
    }));
    await waitFor(() => expect(onCreado).toHaveBeenCalledWith({
      usuario: { id: 9, nombre: 'Ana' }, contrasenaTemp: 'a1b2c3d4',
    }));
  });

  test('alta: identificador duplicado muestra el mensaje del backend', async () => {
    createUser.mockImplementation(() => Promise.reject(new Error('identificador_en_uso')));
    renderModal({ usuario: null });

    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana');
    await userEvent.type(screen.getByLabelText('Identificador'), 'dup@taller.cl');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText(/ya está en uso/i)).toBeInTheDocument();
  });

  test('edición: precarga, no deja cambiar el identificador y actualiza nombre y rol', async () => {
    const usuario = { id: 5, nombre: 'Tec Dos', identificador_acceso: 'tec@taller.cl', rol: 'TECNICO', activo: true };
    updateUser.mockResolvedValue({ ...usuario, nombre: 'Tec Editado' });
    renderModal({ usuario });

    expect(screen.getByLabelText('Nombre')).toHaveValue('Tec Dos');
    // El backend no soporta cambiar el identificador: el campo va deshabilitado.
    expect(screen.getByLabelText('Identificador')).toBeDisabled();

    await userEvent.clear(screen.getByLabelText('Nombre'));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Tec Editado');
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'RECEPCION');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(5, {
      nombre: 'Tec Editado', rol: 'RECEPCION',
    }));
  });
});
