import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PartFormModal } from './PartFormModal';
import { createPart, updatePart } from '../../api/parts';

vi.mock('../../api/parts', () => ({
  createPart: vi.fn(),
  updatePart: vi.fn(),
}));

function renderModal(props) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PartFormModal onClose={vi.fn()} {...props} />
    </QueryClientProvider>
  );
}

describe('PartFormModal', () => {
  beforeEach(() => {
    createPart.mockReset();
    updatePart.mockReset();
  });

  test('alta: sin nombre, muestra error de validación sin llamar a createPart', async () => {
    renderModal({ repuesto: null });

    await userEvent.type(screen.getByLabelText('Stock inicial'), '5');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('El nombre es requerido.')).toBeInTheDocument();
    expect(createPart).not.toHaveBeenCalled();
  });

  test('alta: stock inicial negativo, muestra error sin llamar a createPart', async () => {
    renderModal({ repuesto: null });

    await userEvent.type(screen.getByLabelText('Nombre'), 'Fusible 5A');
    await userEvent.type(screen.getByLabelText('Stock inicial'), '-1');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText(/stock inicial debe ser/i)).toBeInTheDocument();
    expect(createPart).not.toHaveBeenCalled();
  });

  test('alta: datos válidos, llama a createPart y cierra el modal', async () => {
    const onClose = vi.fn();
    createPart.mockResolvedValue({ id: 1, nombre: 'Fusible 5A' });
    renderModal({ repuesto: null, onClose });

    await userEvent.type(screen.getByLabelText('Nombre'), 'Fusible 5A');
    await userEvent.type(screen.getByLabelText('Código (SKU)'), 'F5A');
    await userEvent.type(screen.getByLabelText('Stock inicial'), '10');
    await userEvent.type(screen.getByLabelText('Stock mínimo'), '2');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(createPart).toHaveBeenCalledWith({
        nombre: 'Fusible 5A',
        codigoSku: 'F5A',
        stockActual: 10,
        stockMinimo: 2,
      })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('edición: precarga los campos y no muestra "Stock inicial" ni "Nuevo repuesto"', async () => {
    const repuesto = { id: 5, nombre: 'Fusible 5A', codigoSku: 'F5A', stockActual: 10, stockMinimo: 2, activo: true };
    renderModal({ repuesto });

    expect(screen.getByText('Editar repuesto')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveValue('Fusible 5A');
    expect(screen.getByLabelText('Código (SKU)')).toHaveValue('F5A');
    expect(screen.getByLabelText('Stock mínimo')).toHaveValue(2);
    expect(screen.queryByLabelText('Stock inicial')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Activo')).toBeChecked();
  });

  test('edición: guarda solo nombre/código/mínimo/activo, sin tocar stockActual', async () => {
    const repuesto = { id: 5, nombre: 'Fusible 5A', codigoSku: 'F5A', stockActual: 10, stockMinimo: 2, activo: true };
    updatePart.mockResolvedValue({ ...repuesto, stockMinimo: 3 });
    renderModal({ repuesto });

    await userEvent.clear(screen.getByLabelText('Stock mínimo'));
    await userEvent.type(screen.getByLabelText('Stock mínimo'), '3');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(updatePart).toHaveBeenCalledWith(5, {
        nombre: 'Fusible 5A',
        codigoSku: 'F5A',
        stockMinimo: 3,
        activo: true,
      })
    );
  });

  test('edición: destildar "Activo" da de baja el repuesto', async () => {
    const repuesto = { id: 5, nombre: 'Fusible 5A', codigoSku: 'F5A', stockActual: 10, stockMinimo: 2, activo: true };
    updatePart.mockResolvedValue({ ...repuesto, activo: false });
    renderModal({ repuesto });

    await userEvent.click(screen.getByLabelText('Activo'));
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(updatePart).toHaveBeenCalledWith(5, {
        nombre: 'Fusible 5A',
        codigoSku: 'F5A',
        stockMinimo: 2,
        activo: false,
      })
    );
  });

  test('error del backend (código duplicado) se muestra sin cerrar el modal', async () => {
    const onClose = vi.fn();
    createPart.mockRejectedValue(new Error('codigo_sku_en_uso'));
    renderModal({ repuesto: null, onClose });

    await userEvent.type(screen.getByLabelText('Nombre'), 'Fusible 5A');
    await userEvent.type(screen.getByLabelText('Stock inicial'), '5');
    await userEvent.type(screen.getByLabelText('Stock mínimo'), '1');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('Ese código (SKU) ya está en uso.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
