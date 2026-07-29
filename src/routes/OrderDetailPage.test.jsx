import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderDetailPage } from './OrderDetailPage';
import { getOrder, getReceiptBlob } from '../api/orders';
import { openReceiptInNewTab } from '../lib/receipt';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../api/orders', () => ({
  getOrder: vi.fn(),
  getReceiptBlob: vi.fn(),
}));
vi.mock('../lib/receipt', () => ({
  openReceiptInNewTab: vi.fn(),
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const ORDEN = {
  id: 7,
  fechaIngreso: '2026-07-20T15:00:00.000Z',
  cliente: { id: 1, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111' },
  equipos: [
    {
      id: 1,
      idInterno: 'EQ-0001',
      tipoModelo: 'Mixer Behringer X32',
      marca: 'Behringer',
      numeroSerie: 'SN123',
      fallaReportada: 'No enciende',
      accesorios: 'Cable de poder',
      estado: 'recibido',
    },
  ],
};

function renderPage(id = '7') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/ordenes/${id}`]}>
        <Routes>
          <Route path="/ordenes/:id" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('OrderDetailPage', () => {
  beforeEach(() => {
    getOrder.mockReset();
    getReceiptBlob.mockReset();
    openReceiptInNewTab.mockReset();
    useAuth.mockReset();
    useAuth.mockReturnValue({ usuario: { rol: 'RECEPCION' } });
  });

  test('muestra el cliente y los equipos de la orden', async () => {
    getOrder.mockResolvedValue(ORDEN);

    renderPage();

    expect(await screen.findByText('Ana Soto')).toBeInTheDocument();
    expect(screen.getByText('Mixer Behringer X32')).toBeInTheDocument();
    expect(screen.getByText(/No enciende/)).toBeInTheDocument();
  });

  test('consulta getOrder con el id de la ruta', async () => {
    getOrder.mockResolvedValue(ORDEN);

    renderPage('7');

    await waitFor(() => expect(getOrder).toHaveBeenCalledWith('7'));
  });

  test('muestra ErrorBanner cuando getOrder falla sin crash del componente', async () => {
    getOrder.mockRejectedValue(new Error('orden_no_encontrada'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la orden.')).toBeInTheDocument();
    });
  });

  test('rol TECNICO no ve el botón de comprobante', async () => {
    useAuth.mockReturnValue({ usuario: { rol: 'TECNICO' } });
    getOrder.mockResolvedValue(ORDEN);

    renderPage();

    await screen.findByText('Ana Soto');
    expect(screen.queryByRole('button', { name: /comprobante/i })).not.toBeInTheDocument();
  });

  test('click en "Ver comprobante" descarga y abre el PDF', async () => {
    getOrder.mockResolvedValue(ORDEN);
    const blob = new Blob(['pdf']);
    getReceiptBlob.mockResolvedValue(blob);

    renderPage();
    await screen.findByText('Ana Soto');

    await userEvent.click(screen.getByRole('button', { name: /comprobante/i }));

    await waitFor(() => expect(getReceiptBlob).toHaveBeenCalledWith('7'));
    expect(openReceiptInNewTab).toHaveBeenCalledWith(blob);
  });
});
