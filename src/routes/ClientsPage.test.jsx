import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientsPage } from './ClientsPage';
import { getClients } from '../api/clients';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../api/clients', () => ({
  getClients: vi.fn(),
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../components/clients/ClientFormModal', () => ({
  ClientFormModal: ({ cliente }) => (
    <div data-testid="client-form-modal">{cliente ? `editar-${cliente.id}` : 'nuevo'}</div>
  ),
}));

function renderPage(queryClientOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        ...queryClientOptions,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientsPage />
    </QueryClientProvider>
  );
}

describe('ClientsPage', () => {
  beforeEach(() => {
    getClients.mockReset();
    useAuth.mockReset();
    useAuth.mockReturnValue({ usuario: { rol: 'RECEPCION' } });
  });

  test('muestra los clientes que devuelve getClients', async () => {
    getClients.mockResolvedValue({
      data: [{ id: 1, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111', correo: null, rut: null }],
      total: 1,
      limit: 20,
      offset: 0,
    });

    renderPage();

    expect(await screen.findByText('Ana Soto')).toBeInTheDocument();
  });

  test('escribir en el buscador termina consultando getClients con el término (debounced)', async () => {
    getClients.mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0 });
    renderPage();
    await waitFor(() => expect(getClients).toHaveBeenCalledTimes(1));

    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'ana');

    await waitFor(
      () => expect(getClients).toHaveBeenLastCalledWith({ q: 'ana', limit: 20, offset: 0 }),
      { timeout: 1000 }
    );
  });

  test('rol TECNICO no ve el botón "Nuevo cliente" ni "Editar"', async () => {
    useAuth.mockReturnValue({ usuario: { rol: 'TECNICO' } });
    getClients.mockResolvedValue({
      data: [{ id: 1, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111', correo: null, rut: null }],
      total: 1,
      limit: 20,
      offset: 0,
    });

    renderPage();

    await screen.findByText('Ana Soto');
    expect(screen.queryByRole('button', { name: /nuevo cliente/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  test('click en "Nuevo cliente" abre el modal en modo alta', async () => {
    getClients.mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0 });
    renderPage();
    await waitFor(() => expect(getClients).toHaveBeenCalled());

    await userEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }));

    expect(screen.getByTestId('client-form-modal')).toHaveTextContent('nuevo');
  });

  test('muestra ErrorBanner cuando getClients falla sin crash del componente', async () => {
    getClients.mockRejectedValue(new Error('fallo_red'));

    renderPage();

    // Wait for the error banner to appear after loading finishes
    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la lista de clientes.')).toBeInTheDocument();
    });
  });

  test('paginado: "Anterior" deshabilitado en la primera página, "Siguiente" navega a offset 20', async () => {
    const page1 = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      nombre: `Cliente ${i}`,
      empresa: null,
      telefono: '+56900000000',
      correo: null,
      rut: null,
    }));
    const page2 = Array.from({ length: 20 }, (_, i) => ({
      id: i + 20,
      nombre: `Cliente ${i + 20}`,
      empresa: null,
      telefono: '+56900000000',
      correo: null,
      rut: null,
    }));

    getClients.mockResolvedValueOnce({ data: page1, total: 45, limit: 20, offset: 0 });
    getClients.mockResolvedValueOnce({ data: page2, total: 45, limit: 20, offset: 20 });

    renderPage();

    await screen.findByText('Cliente 0');

    const anteriorBtn = screen.getByRole('button', { name: /anterior/i });
    const siguienteBtn = screen.getByRole('button', { name: /siguiente/i });

    expect(anteriorBtn).toBeDisabled();
    expect(siguienteBtn).not.toBeDisabled();

    await userEvent.click(siguienteBtn);

    await waitFor(() =>
      expect(getClients).toHaveBeenLastCalledWith({ q: undefined, limit: 20, offset: 20 })
    );

    await screen.findByText('Cliente 20');
    expect(screen.getByRole('button', { name: /anterior/i })).not.toBeDisabled();
  });
});
