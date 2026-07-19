import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientFormModal } from './ClientFormModal';
import { createClient, updateClient } from '../../api/clients';

vi.mock('../../api/clients', () => ({
  createClient: vi.fn(),
  updateClient: vi.fn(),
}));

function renderModal(props) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientFormModal onClose={vi.fn()} {...props} />
    </QueryClientProvider>
  );
}

describe('ClientFormModal', () => {
  beforeEach(() => {
    createClient.mockReset();
    updateClient.mockReset();
  });

  test('alta: sin teléfono, muestra error de validación sin llamar a createClient', async () => {
    renderModal({ cliente: null });

    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana Soto');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('El teléfono es requerido.')).toBeInTheDocument();
    expect(createClient).not.toHaveBeenCalled();
  });

  test('alta: sin nombre ni empresa, muestra error de validación', async () => {
    renderModal({ cliente: null });

    await userEvent.type(screen.getByLabelText('Teléfono'), '+56911111111');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('Debes indicar nombre o empresa.')).toBeInTheDocument();
    expect(createClient).not.toHaveBeenCalled();
  });

  test('alta: datos válidos, llama a createClient y cierra el modal', async () => {
    const onClose = vi.fn();
    createClient.mockResolvedValue({ id: 9, nombre: 'Ana Soto', telefono: '+56911111111' });
    renderModal({ cliente: null, onClose });

    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana Soto');
    await userEvent.type(screen.getByLabelText('Teléfono'), '+56911111111');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(createClient).toHaveBeenCalledWith({
        nombre: 'Ana Soto',
        empresa: null,
        telefono: '+56911111111',
        correo: null,
        rut: null,
      })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('edición: precarga los campos del cliente y llama a updateClient con su id', async () => {
    const cliente = { id: 5, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111', correo: null, rut: null };
    updateClient.mockResolvedValue({ ...cliente, telefono: '+56922222222' });
    renderModal({ cliente });

    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Soto');
    expect(screen.getByLabelText('Teléfono')).toHaveValue('+56911111111');

    await userEvent.clear(screen.getByLabelText('Teléfono'));
    await userEvent.type(screen.getByLabelText('Teléfono'), '+56922222222');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(updateClient).toHaveBeenCalledWith(5, {
        nombre: 'Ana Soto',
        empresa: null,
        telefono: '+56922222222',
        correo: null,
        rut: null,
      })
    );
  });

  test('error del backend se muestra sin cerrar el modal', async () => {
    const onClose = vi.fn();
    // Mock createClient para rechazar con un error no mapeado en SERVER_ERROR_MESSAGES
    createClient.mockRejectedValue(new Error('algo_no_mapeado'));
    renderModal({ cliente: null, onClose });

    // Llenar con datos VÁLIDOS para que pase la validación del cliente
    // y createClient sea efectivamente llamado
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana Soto');
    await userEvent.type(screen.getByLabelText('Teléfono'), '+56911111111');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    // El error del backend debe mostrarse con el fallback message
    // (dado que 'algo_no_mapeado' no está en SERVER_ERROR_MESSAGES)
    expect(await screen.findByText('No se pudo guardar el cliente.')).toBeInTheDocument();
    // El modal NO debe cerrarse en caso de error
    expect(onClose).not.toHaveBeenCalled();
  });
});
