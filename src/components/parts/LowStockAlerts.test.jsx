import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LowStockAlerts } from './LowStockAlerts';
import { getLowStockAlerts } from '../../api/parts';

vi.mock('../../api/parts', () => ({
  getLowStockAlerts: vi.fn(),
}));

function renderAlerts() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <LowStockAlerts />
      </QueryClientProvider>
    ),
  };
}

// El componente no renderiza nada ni mientras carga ni cuando no hay alertas,
// así que "el DOM está vacío" no distingue un caso del otro. Hay que esperar a
// que la query realmente termine antes de afirmar sobre el resultado.
function esperarQuery(queryClient, estado) {
  return waitFor(() =>
    expect(queryClient.getQueryState(['repuestos-alertas'])?.status).toBe(estado)
  );
}

describe('LowStockAlerts', () => {
  beforeEach(() => {
    getLowStockAlerts.mockReset();
  });

  test('con alertas, muestra nombre y stock actual/mínimo de cada una', async () => {
    getLowStockAlerts.mockResolvedValue([
      { id: 1, nombre: 'Fusible 5A', codigoSku: 'F5A', stockActual: 1, stockMinimo: 5 },
      { id: 2, nombre: 'Cable HDMI', codigoSku: null, stockActual: 0, stockMinimo: 2 },
    ]);

    renderAlerts();

    expect(await screen.findByText(/fusible 5a/i)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ mínimo 5/)).toBeInTheDocument();
    expect(screen.getByText(/cable hdmi/i)).toBeInTheDocument();
    expect(screen.getByText('Stock bajo (2)')).toBeInTheDocument();
  });

  test('sin alertas, no renderiza nada (con la query ya resuelta)', async () => {
    getLowStockAlerts.mockResolvedValue([]);

    const { container, queryClient } = renderAlerts();

    await esperarQuery(queryClient, 'success');
    expect(queryClient.getQueryData(['repuestos-alertas'])).toEqual([]);
    expect(container).toBeEmptyDOMElement();
  });

  test('si getLowStockAlerts falla, avisa en vez de desaparecer en silencio', async () => {
    getLowStockAlerts.mockRejectedValue(new Error('fallo_red'));

    const { queryClient } = renderAlerts();

    await esperarQuery(queryClient, 'error');
    expect(
      screen.getByText('No se pudo cargar el estado de stock de los repuestos.')
    ).toBeInTheDocument();
  });
});
