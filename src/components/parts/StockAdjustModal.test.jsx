import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StockAdjustModal } from './StockAdjustModal';
import { adjustStock } from '../../api/parts';

vi.mock('../../api/parts', () => ({
  adjustStock: vi.fn(),
}));

const REPUESTO = { id: 5, nombre: 'Fusible 5A', stockActual: 10 };

function renderModal(props) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <StockAdjustModal repuesto={REPUESTO} onClose={vi.fn()} {...props} />
    </QueryClientProvider>
  );
}

describe('StockAdjustModal', () => {
  beforeEach(() => {
    adjustStock.mockReset();
  });

  test('muestra el nombre y el stock actual del repuesto', () => {
    renderModal();

    expect(screen.getByText(/fusible 5a/i)).toBeInTheDocument();
    expect(screen.getByText(/stock actual: 10/i)).toBeInTheDocument();
  });

  test('sin cantidad ingresada, "Confirmar" está deshabilitado', () => {
    renderModal();

    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();
  });

  test('cantidad 0, "Confirmar" está deshabilitado', async () => {
    renderModal();

    await userEvent.type(screen.getByLabelText(/cantidad/i), '0');

    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();
  });

  test('delta positivo muestra el stock resultante y confirma con adjustStock', async () => {
    const onClose = vi.fn();
    adjustStock.mockResolvedValue({ id: 5, stockActual: 15 });
    renderModal({ onClose });

    await userEvent.type(screen.getByLabelText(/cantidad/i), '5');

    expect(screen.getByText(/stock resultante: 15/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => expect(adjustStock).toHaveBeenCalledWith(5, { ajusteStock: 5 }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('delta negativo que dejaría el stock en negativo bloquea "Confirmar" sin llamar a la API', async () => {
    renderModal();

    await userEvent.type(screen.getByLabelText(/cantidad/i), '-20');

    expect(screen.getByText(/stock resultante: -10/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();
    expect(adjustStock).not.toHaveBeenCalled();
  });

  test('error del backend (stock_insuficiente) se muestra sin cerrar el modal', async () => {
    const onClose = vi.fn();
    adjustStock.mockRejectedValue(new Error('stock_insuficiente'));
    renderModal({ onClose });

    await userEvent.type(screen.getByLabelText(/cantidad/i), '-5');
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(await screen.findByText('No hay stock suficiente para este ajuste.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
