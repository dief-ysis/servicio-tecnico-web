import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderFormModal } from './OrderFormModal';
import { createOrder } from '../../api/orders';
import { getClients, createClient } from '../../api/clients';

// Integración: a diferencia de OrderFormModal.test.jsx, aquí NO se mockea ClientPicker
// ni ClientFormModal — se usa el flujo real de "+ Crear cliente nuevo" para verificar
// que crear un cliente inline desde dentro del formulario de la orden funciona de punta
// a punta (createClient se llama, el cliente queda seleccionado, y no queda un error
// de validación falso pegado en el formulario de la orden).
vi.mock('../../api/orders', () => ({
  createOrder: vi.fn(),
  getReceiptBlob: vi.fn(),
}));
vi.mock('../../api/clients', () => ({
  getClients: vi.fn(),
  createClient: vi.fn(),
}));

function renderModal(props) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <OrderFormModal onClose={vi.fn()} {...props} />
    </QueryClientProvider>
  );
}

describe('OrderFormModal + ClientPicker + ClientFormModal (integración)', () => {
  beforeEach(() => {
    createOrder.mockReset();
    getClients.mockReset();
    createClient.mockReset();
    getClients.mockResolvedValue({ data: [], total: 0, limit: 8, offset: 0 });
  });

  test('crear un cliente nuevo desde "Nueva orden" lo deja seleccionado sin error falso de validación', async () => {
    createClient.mockResolvedValue({ id: 99, nombre: 'Ana Soto', telefono: '+56911111111' });
    renderModal();

    await userEvent.click(screen.getByRole('button', { name: /crear cliente nuevo/i }));
    const clienteModal = screen.getByRole('heading', { name: 'Nuevo cliente' }).closest('form');
    await userEvent.type(within(clienteModal).getByLabelText('Nombre'), 'Ana Soto');
    await userEvent.type(within(clienteModal).getByLabelText('Teléfono'), '+56911111111');
    await userEvent.click(within(clienteModal).getByRole('button', { name: /^guardar$/i }));

    await waitFor(() =>
      expect(createClient).toHaveBeenCalledWith({
        nombre: 'Ana Soto',
        empresa: null,
        telefono: '+56911111111',
        correo: null,
        rut: null,
      })
    );

    expect(await screen.findByText('Ana Soto — +56911111111')).toBeInTheDocument();
    expect(screen.queryByText('Debes seleccionar un cliente.')).not.toBeInTheDocument();
  });
});
