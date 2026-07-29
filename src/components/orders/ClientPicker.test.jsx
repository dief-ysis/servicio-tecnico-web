import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientPicker } from './ClientPicker';
import { getClients } from '../../api/clients';

vi.mock('../../api/clients', () => ({
  getClients: vi.fn(),
}));
vi.mock('../clients/ClientFormModal', () => ({
  ClientFormModal: ({ onSaved }) => (
    <button
      type="button"
      onClick={() => onSaved({ id: 99, nombre: 'Cliente Nuevo', telefono: '+56900000000' })}
    >
      guardar-cliente-mock
    </button>
  ),
}));

function renderPicker(props) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientPicker cliente={null} onChange={vi.fn()} {...props} />
    </QueryClientProvider>
  );
}

describe('ClientPicker', () => {
  beforeEach(() => {
    getClients.mockReset();
  });

  test('con menos de 2 caracteres, no consulta getClients', async () => {
    renderPicker();
    await userEvent.type(screen.getByLabelText('Cliente'), 'a');
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(getClients).not.toHaveBeenCalled();
  });

  test('busca y al seleccionar un resultado llama a onChange con el cliente', async () => {
    getClients.mockResolvedValue({
      data: [{ id: 3, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111' }],
      total: 1,
      limit: 8,
      offset: 0,
    });
    const onChange = vi.fn();
    renderPicker({ onChange });

    await userEvent.type(screen.getByLabelText('Cliente'), 'ana');

    await waitFor(() => expect(getClients).toHaveBeenCalledWith({ q: 'ana', limit: 8 }));
    await userEvent.click(await screen.findByRole('button', { name: /ana soto/i }));

    expect(onChange).toHaveBeenCalledWith({ id: 3, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111' });
  });

  test('con cliente ya seleccionado, muestra su nombre y un botón para cambiarlo', async () => {
    const onChange = vi.fn();
    renderPicker({ cliente: { id: 5, nombre: 'Ana Soto', telefono: '+56911111111' }, onChange });

    expect(screen.getByText(/ana soto/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /cambiar/i }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  test('crear cliente nuevo llama a onChange con el cliente creado', async () => {
    getClients.mockResolvedValue({ data: [], total: 0, limit: 8, offset: 0 });
    const onChange = vi.fn();
    renderPicker({ onChange });

    await userEvent.click(screen.getByRole('button', { name: /crear cliente nuevo/i }));
    await userEvent.click(screen.getByRole('button', { name: /guardar-cliente-mock/i }));

    expect(onChange).toHaveBeenCalledWith({ id: 99, nombre: 'Cliente Nuevo', telefono: '+56900000000' });
  });
});
