import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientsPage } from './ClientsPage';
import { getClients, createClient } from '../api/clients';
import { useAuth } from '../contexts/AuthContext';

// Integración: alta de cliente -> invalidateQueries -> refetch -> aparece en la tabla.
// A diferencia de ClientsPage.test.jsx, aquí NO se mockea ClientFormModal: se usa el
// componente real para verificar que todo el circuito (submit -> mutation -> invalidación
// de la query 'clientes' -> refetch -> render) funciona de punta a punta.
vi.mock('../api/clients', () => ({
  getClients: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientsPage />
    </QueryClientProvider>
  );
}

describe('ClientsPage + ClientFormModal (integración)', () => {
  beforeEach(() => {
    getClients.mockReset();
    createClient.mockReset();
    useAuth.mockReset();
    useAuth.mockReturnValue({ usuario: { rol: 'RECEPCION' } });
  });

  test('crear un cliente nuevo refresca la lista y lo muestra sin recargar la página', async () => {
    getClients.mockResolvedValueOnce({ data: [], total: 0, limit: 20, offset: 0 });
    getClients.mockResolvedValue({
      data: [{ id: 99, nombre: 'Beatriz Nuevo', empresa: null, telefono: '+56933333333', correo: null, rut: null }],
      total: 1,
      limit: 20,
      offset: 0,
    });
    createClient.mockResolvedValue({ id: 99, nombre: 'Beatriz Nuevo', telefono: '+56933333333' });

    renderPage();

    await screen.findByText('Sin resultados.');

    await userEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }));

    await userEvent.type(screen.getByLabelText('Nombre'), 'Beatriz Nuevo');
    await userEvent.type(screen.getByLabelText('Teléfono'), '+56933333333');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(createClient).toHaveBeenCalledWith({
        nombre: 'Beatriz Nuevo',
        empresa: null,
        telefono: '+56933333333',
        correo: null,
        rut: null,
      })
    );

    expect(await screen.findByText('Beatriz Nuevo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^guardar$/i })).not.toBeInTheDocument();
  });
});
