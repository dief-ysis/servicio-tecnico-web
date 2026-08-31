import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartsTable } from './PartsTable';

const REPUESTOS = [
  { id: 1, nombre: 'Fusible 5A', codigoSku: 'F5A', stockActual: 12, stockMinimo: 2, activo: true },
  { id: 2, nombre: 'Cable HDMI', codigoSku: null, stockActual: 0, stockMinimo: 1, activo: false },
];

describe('PartsTable', () => {
  test('renderiza una fila por repuesto con código, stock y estado', () => {
    render(<PartsTable repuestos={REPUESTOS} canWrite={false} onEdit={vi.fn()} onAdjustStock={vi.fn()} />);

    expect(screen.getByText('Fusible 5A')).toBeInTheDocument();
    expect(screen.getByText('F5A')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Cable HDMI')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  test('sin repuestos, muestra el estado vacío', () => {
    render(<PartsTable repuestos={[]} canWrite={false} onEdit={vi.fn()} onAdjustStock={vi.fn()} />);

    expect(screen.getByText('Sin resultados.')).toBeInTheDocument();
  });

  test('canWrite=false (TECNICO) no muestra botones de acción', () => {
    render(<PartsTable repuestos={REPUESTOS} canWrite={false} onEdit={vi.fn()} onAdjustStock={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ajustar stock/i })).not.toBeInTheDocument();
  });

  test('canWrite=true muestra "Editar" y "Ajustar stock", y llaman a los callbacks con el repuesto de la fila', async () => {
    const onEdit = vi.fn();
    const onAdjustStock = vi.fn();
    render(<PartsTable repuestos={REPUESTOS} canWrite={true} onEdit={onEdit} onAdjustStock={onAdjustStock} />);

    const editarBtns = screen.getAllByRole('button', { name: /^editar$/i });
    await userEvent.click(editarBtns[0]);
    expect(onEdit).toHaveBeenCalledWith(REPUESTOS[0]);

    const ajustarBtns = screen.getAllByRole('button', { name: /ajustar stock/i });
    await userEvent.click(ajustarBtns[1]);
    expect(onAdjustStock).toHaveBeenCalledWith(REPUESTOS[1]);
  });
});
