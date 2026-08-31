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
  return render(
    <QueryClientProvider client={queryClient}>
      <LowStockAlerts />
    </QueryClientProvider>
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

  test('sin alertas, no renderiza nada', async () => {
    getLowStockAlerts.mockResolvedValue([]);

    const { container } = renderAlerts();

    await waitFor(() => expect(getLowStockAlerts).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  test('si getLowStockAlerts falla, no rompe (no renderiza nada)', async () => {
    getLowStockAlerts.mockRejectedValue(new Error('fallo_red'));

    const { container } = renderAlerts();

    await waitFor(() => expect(getLowStockAlerts).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
