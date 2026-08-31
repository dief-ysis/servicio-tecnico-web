import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrdersPage } from './OrdersPage';
import { getOrders } from '../api/orders';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../api/orders', () => ({
  getOrders: vi.fn(),
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../components/orders/OrderFormModal', () => ({
  OrderFormModal: () => <div data-testid="order-form-modal" />,
}));
vi.mock('../components/orders/ClientPicker', () => ({
  ClientPicker: ({ cliente, onChange }) => (
    <button type="button" onClick={() => onChange(cliente ? null : { id: 3, nombre: 'Ana Soto' })}>
      filtro-cliente-mock
    </button>
  ),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const ORDEN = {
  id: 1,
  fechaIngreso: '2026-07-20T15:00:00.000Z',
  cliente: { id: 1, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111' },
  totalEquipos: 2,
};

describe('OrdersPage', () => {
  beforeEach(() => {
    getOrders.mockReset();
    useAuth.mockReset();
    useAuth.mockReturnValue({ usuario: { rol: 'RECEPCION' } });
  });

  test('muestra las órdenes que devuelve getOrders', async () => {
    getOrders.mockResolvedValue({ data: [ORDEN], total: 1, limit: 20, offset: 0 });

    renderPage();

    expect(await screen.findByText('Ana Soto')).toBeInTheDocument();
  });

  test('muestra ErrorBanner cuando getOrders falla sin crash del componente', async () => {
    getOrders.mockRejectedValue(new Error('fallo_red'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la lista de órdenes.')).toBeInTheDocument();
    });
  });

  test('rol TECNICO no ve el botón "Nueva orden"', async () => {
    useAuth.mockReturnValue({ usuario: { rol: 'TECNICO' } });
    getOrders.mockResolvedValue({ data: [ORDEN], total: 1, limit: 20, offset: 0 });

    renderPage();

    await screen.findByText('Ana Soto');
    expect(screen.queryByRole('button', { name: /nueva orden/i })).not.toBeInTheDocument();
  });

  test('click en "Nueva orden" abre el modal', async () => {
    getOrders.mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0 });
    renderPage();
    await waitFor(() => expect(getOrders).toHaveBeenCalled());

    await userEvent.click(screen.getByRole('button', { name: /nueva orden/i }));

    expect(screen.getByTestId('order-form-modal')).toBeInTheDocument();
  });

  test('seleccionar un cliente en el filtro consulta getOrders con clienteId', async () => {
    getOrders.mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0 });
    renderPage();
    await waitFor(() =>
      expect(getOrders).toHaveBeenCalledWith({ clienteId: undefined, limit: 20, offset: 0 })
    );

    await userEvent.click(screen.getByRole('button', { name: /filtro-cliente-mock/i }));

    await waitFor(() =>
      expect(getOrders).toHaveBeenLastCalledWith({ clienteId: 3, limit: 20, offset: 0 })
    );
  });

  test('seleccionar un cliente en el filtro realmente resetea la página (no solo coincide con offset 0 inicial)', async () => {
    const page1 = Array.from({ length: 20 }, (_, i) => ({ ...ORDEN, id: i, cliente: { ...ORDEN.cliente, nombre: `Cliente ${i}` } }));
    getOrders.mockResolvedValue({ data: page1, total: 45, limit: 20, offset: 0 });

    renderPage();
    await screen.findByText('Cliente 0');

    // Avanza a la página 2 (offset 20) ANTES de aplicar el filtro.
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() =>
      expect(getOrders).toHaveBeenLastCalledWith({ clienteId: undefined, limit: 20, offset: 20 })
    );

    await userEvent.click(screen.getByRole('button', { name: /filtro-cliente-mock/i }));

    await waitFor(() =>
      expect(getOrders).toHaveBeenLastCalledWith({ clienteId: 3, limit: 20, offset: 0 })
    );
  });

  test('paginado: "Anterior" deshabilitado en la primera página, "Siguiente" navega a offset 20', async () => {
    const page1 = Array.from({ length: 20 }, (_, i) => ({ ...ORDEN, id: i, cliente: { ...ORDEN.cliente, nombre: `Cliente ${i}` } }));
    const page2 = Array.from({ length: 20 }, (_, i) => ({ ...ORDEN, id: i + 20, cliente: { ...ORDEN.cliente, nombre: `Cliente ${i + 20}` } }));

    getOrders.mockResolvedValueOnce({ data: page1, total: 45, limit: 20, offset: 0 });
    getOrders.mockResolvedValueOnce({ data: page2, total: 45, limit: 20, offset: 20 });

    renderPage();

    await screen.findByText('Cliente 0');

    const siguienteBtn = screen.getByRole('button', { name: /siguiente/i });
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();

    await userEvent.click(siguienteBtn);

    await waitFor(() =>
      expect(getOrders).toHaveBeenLastCalledWith({ clienteId: undefined, limit: 20, offset: 20 })
    );
    await screen.findByText('Cliente 20');
  });
});
