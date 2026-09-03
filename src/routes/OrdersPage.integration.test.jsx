import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrdersPage } from './OrdersPage';
import { getOrders, createOrder, getReceiptBlob } from '../api/orders';
import { getClients } from '../api/clients';
import { downloadReceipt } from '../lib/receipt';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../api/orders', () => ({
  getOrders: vi.fn(),
  createOrder: vi.fn(),
  getReceiptBlob: vi.fn(),
}));
vi.mock('../api/clients', () => ({
  getClients: vi.fn(),
}));
vi.mock('../lib/receipt', () => ({
  downloadReceipt: vi.fn(),
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
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

describe('OrdersPage + OrderFormModal (integración)', () => {
  beforeEach(() => {
    getOrders.mockReset();
    createOrder.mockReset();
    getReceiptBlob.mockReset();
    getClients.mockReset();
    downloadReceipt.mockReset();
    useAuth.mockReset();
    useAuth.mockReturnValue({ usuario: { rol: 'RECEPCION' } });
  });

  // Timeout explícito: es el test más pesado de la suite —monta ClientPicker,
  // OrderFormModal y ClientFormModal reales, con la búsqueda debounced de 300ms
  // y varias interacciones de userEvent— y bajo carga en paralelo rozaba los
  // 5s por defecto (visto: 5127ms). Falla intermitente, no un problema real.
  test('crear una orden para un cliente existente refresca la lista y descarga el comprobante', { timeout: 20000 }, async () => {
    getOrders.mockResolvedValueOnce({ data: [], total: 0, limit: 20, offset: 0 });
    getOrders.mockResolvedValue({
      data: [
        {
          id: 5,
          fechaIngreso: '2026-07-21T12:00:00.000Z',
          cliente: { id: 3, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111' },
          totalEquipos: 1,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
    getClients.mockResolvedValue({
      data: [{ id: 3, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111', correo: null, rut: null }],
      total: 1,
      limit: 8,
      offset: 0,
    });
    createOrder.mockResolvedValue({ id: 5 });
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    getReceiptBlob.mockResolvedValue(blob);

    renderPage();
    await screen.findByText('Sin resultados.');

    await userEvent.click(screen.getByRole('button', { name: /nueva orden/i }));

    await userEvent.type(screen.getByLabelText('Tipo / modelo'), 'Consola DMX');
    await userEvent.type(screen.getByLabelText('Falla reportada'), 'No enciende');

    const clienteInputs = screen.getAllByLabelText('Cliente');
    await userEvent.type(clienteInputs[clienteInputs.length - 1], 'ana');
    await userEvent.click(await screen.findByRole('button', { name: /ana soto/i }));

    await userEvent.click(screen.getByRole('button', { name: /^guardar$/i }));

    await waitFor(() =>
      expect(createOrder).toHaveBeenCalledWith({
        clienteId: 3,
        equipos: [
          {
            tipoModelo: 'Consola DMX',
            marca: null,
            numeroSerie: null,
            fallaReportada: 'No enciende',
            accesorios: null,
            requierePresupuesto: false,
          },
        ],
      })
    );

    await waitFor(() => expect(getReceiptBlob).toHaveBeenCalledWith(5));
    expect(downloadReceipt).toHaveBeenCalledWith(blob, 'comprobante-5.pdf');
    expect(await screen.findByText('Ana Soto')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^guardar$/i })).not.toBeInTheDocument();
  });
});
