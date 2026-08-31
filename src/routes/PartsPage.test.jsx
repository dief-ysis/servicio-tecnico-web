import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PartsPage } from './PartsPage';
import { getParts } from '../api/parts';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../api/parts', () => ({
  getParts: vi.fn(),
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../components/parts/LowStockAlerts', () => ({
  LowStockAlerts: () => <div data-testid="low-stock-alerts" />,
}));
vi.mock('../components/parts/PartFormModal', () => ({
  PartFormModal: ({ repuesto }) => (
    <div data-testid="part-form-modal">{repuesto ? `editar-${repuesto.id}` : 'nuevo'}</div>
  ),
}));
vi.mock('../components/parts/StockAdjustModal', () => ({
  StockAdjustModal: ({ repuesto }) => <div data-testid="stock-adjust-modal">ajuste-{repuesto.id}</div>,
}));
vi.mock('../components/parts/PartsTable', () => ({
  PartsTable: ({ repuestos, canWrite, onEdit, onAdjustStock }) => (
    <div>
      {repuestos.map((r) => (
        <div key={r.id}>
          <span>{r.nombre}</span>
          {canWrite && (
            <>
              <button onClick={() => onEdit(r)}>editar-{r.id}</button>
              <button onClick={() => onAdjustStock(r)}>ajustar-{r.id}</button>
            </>
          )}
        </div>
      ))}
    </div>
  ),
}));

const REPUESTOS = [{ id: 1, nombre: 'Fusible 5A', codigoSku: 'F5A', stockActual: 12, stockMinimo: 2, activo: true }];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PartsPage />
    </QueryClientProvider>
  );
}

describe('PartsPage', () => {
  beforeEach(() => {
    getParts.mockReset();
    useAuth.mockReset();
    useAuth.mockReturnValue({ usuario: { rol: 'ADMIN' } });
  });

  test('muestra los repuestos que devuelve getParts', async () => {
    getParts.mockResolvedValue(REPUESTOS);

    renderPage();

    expect(await screen.findByText('Fusible 5A')).toBeInTheDocument();
  });

  test('escribir en el buscador consulta getParts con el término (debounced)', async () => {
    getParts.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(getParts).toHaveBeenCalledWith({ buscar: '', incluirInactivos: false }));

    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'fusible');

    await waitFor(
      () => expect(getParts).toHaveBeenLastCalledWith({ buscar: 'fusible', incluirInactivos: false }),
      { timeout: 1000 }
    );
  });

  test('activar "Incluir inactivos" consulta getParts con incluirInactivos: true', async () => {
    getParts.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(getParts).toHaveBeenCalled());

    await userEvent.click(screen.getByLabelText(/incluir inactivos/i));

    await waitFor(() => expect(getParts).toHaveBeenLastCalledWith({ buscar: '', incluirInactivos: true }));
  });

  test('rol TECNICO no ve el botón "Nuevo repuesto" ni las acciones de la tabla', async () => {
    useAuth.mockReturnValue({ usuario: { rol: 'TECNICO' } });
    getParts.mockResolvedValue(REPUESTOS);

    renderPage();

    await screen.findByText('Fusible 5A');
    expect(screen.queryByRole('button', { name: /nuevo repuesto/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/editar-1/)).not.toBeInTheDocument();
  });

  test('click en "Nuevo repuesto" abre el modal en modo alta', async () => {
    getParts.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(getParts).toHaveBeenCalled());

    await userEvent.click(screen.getByRole('button', { name: /nuevo repuesto/i }));

    expect(screen.getByTestId('part-form-modal')).toHaveTextContent('nuevo');
  });

  test('click en "Editar" de una fila abre el modal de edición con ese repuesto', async () => {
    getParts.mockResolvedValue(REPUESTOS);
    renderPage();
    await screen.findByText('Fusible 5A');

    await userEvent.click(screen.getByText('editar-1'));

    expect(screen.getByTestId('part-form-modal')).toHaveTextContent('editar-1');
  });

  test('click en "Ajustar stock" de una fila abre StockAdjustModal con ese repuesto', async () => {
    getParts.mockResolvedValue(REPUESTOS);
    renderPage();
    await screen.findByText('Fusible 5A');

    await userEvent.click(screen.getByText('ajustar-1'));

    expect(screen.getByTestId('stock-adjust-modal')).toHaveTextContent('ajuste-1');
  });

  test('muestra ErrorBanner cuando getParts falla sin crash del componente', async () => {
    getParts.mockRejectedValue(new Error('fallo_red'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar el catálogo de repuestos.')).toBeInTheDocument();
    });
  });
});
