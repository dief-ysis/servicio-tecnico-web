import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderFormModal } from './OrderFormModal';
import { createOrder, getReceiptBlob } from '../../api/orders';
import { openReceiptInNewTab } from '../../lib/receipt';

vi.mock('../../api/orders', () => ({
  createOrder: vi.fn(),
  getReceiptBlob: vi.fn(),
}));
vi.mock('../../lib/receipt', () => ({
  openReceiptInNewTab: vi.fn(),
}));
vi.mock('./ClientPicker', () => ({
  ClientPicker: ({ cliente, onChange }) => (
    <div>
      <span data-testid="cliente-seleccionado">{cliente ? cliente.nombre : 'ninguno'}</span>
      <button
        type="button"
        onClick={() => onChange({ id: 7, nombre: 'Ana Soto', telefono: '+56911111111' })}
      >
        seleccionar-cliente-mock
      </button>
    </div>
  ),
}));

function renderModal(props) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <OrderFormModal onClose={vi.fn()} {...props} />
    </QueryClientProvider>
  );
}

describe('OrderFormModal', () => {
  beforeEach(() => {
    createOrder.mockReset();
    getReceiptBlob.mockReset();
    openReceiptInNewTab.mockReset();
  });

  test('sin cliente seleccionado, muestra error de validación sin llamar a createOrder', async () => {
    renderModal();

    await userEvent.click(screen.getByRole('button', { name: /^guardar$/i }));

    expect(await screen.findByText('Debes seleccionar un cliente.')).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
  });

  test('con cliente pero sin tipo/modelo del equipo, muestra error de validación', async () => {
    renderModal();

    await userEvent.click(screen.getByRole('button', { name: /seleccionar-cliente-mock/i }));
    await userEvent.type(screen.getByLabelText('Falla reportada'), 'No enciende');
    await userEvent.click(screen.getByRole('button', { name: /^guardar$/i }));

    expect(await screen.findByText('Equipo 1: el tipo/modelo es requerido.')).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
  });

  test('agrega y quita equipos dinámicamente', async () => {
    renderModal();

    expect(screen.getAllByText(/^Equipo \d$/)).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: /agregar equipo/i }));
    expect(screen.getAllByText(/^Equipo \d$/)).toHaveLength(2);

    await userEvent.click(screen.getAllByRole('button', { name: /quitar/i })[1]);
    expect(screen.getAllByText(/^Equipo \d$/)).toHaveLength(1);
  });

  test('envía la orden con los datos completos, invalida la query y abre el comprobante', async () => {
    const onClose = vi.fn();
    createOrder.mockResolvedValue({ id: 42 });
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    getReceiptBlob.mockResolvedValue(blob);
    renderModal({ onClose });

    await userEvent.click(screen.getByRole('button', { name: /seleccionar-cliente-mock/i }));
    await userEvent.type(screen.getByLabelText('Tipo / modelo'), 'Consola DMX');
    await userEvent.type(screen.getByLabelText('Falla reportada'), 'No enciende');
    await userEvent.click(screen.getByRole('button', { name: /^guardar$/i }));

    await waitFor(() =>
      expect(createOrder).toHaveBeenCalledWith({
        clienteId: 7,
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

    await waitFor(() => expect(getReceiptBlob).toHaveBeenCalledWith(42));
    expect(openReceiptInNewTab).toHaveBeenCalledWith(blob);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('si falla la descarga del comprobante, la orden igual se considera creada y el modal se cierra', async () => {
    const onClose = vi.fn();
    createOrder.mockResolvedValue({ id: 42 });
    getReceiptBlob.mockRejectedValue(new Error('fallo_red'));
    renderModal({ onClose });

    await userEvent.click(screen.getByRole('button', { name: /seleccionar-cliente-mock/i }));
    await userEvent.type(screen.getByLabelText('Tipo / modelo'), 'Consola DMX');
    await userEvent.type(screen.getByLabelText('Falla reportada'), 'No enciende');
    await userEvent.click(screen.getByRole('button', { name: /^guardar$/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(screen.queryByText('No se pudo crear la orden.')).not.toBeInTheDocument();
  });

  test('error del backend se muestra sin cerrar el modal', async () => {
    const onClose = vi.fn();
    createOrder.mockRejectedValue(new Error('cliente_no_encontrado'));
    renderModal({ onClose });

    await userEvent.click(screen.getByRole('button', { name: /seleccionar-cliente-mock/i }));
    await userEvent.type(screen.getByLabelText('Tipo / modelo'), 'Consola DMX');
    await userEvent.type(screen.getByLabelText('Falla reportada'), 'No enciende');
    await userEvent.click(screen.getByRole('button', { name: /^guardar$/i }));

    expect(await screen.findByText('El cliente seleccionado ya no existe.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
