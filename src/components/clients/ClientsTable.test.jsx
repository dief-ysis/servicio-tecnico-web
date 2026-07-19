import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientsTable } from './ClientsTable';

const CLIENTES = [
  { id: 1, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111', correo: 'ana@mail.com', rut: '11.111.111-1' },
  { id: 2, nombre: null, empresa: 'Luces SpA', telefono: '+56922222222', correo: null, rut: null },
];

describe('ClientsTable', () => {
  test('renderiza una fila por cliente con nombre o empresa', () => {
    render(<ClientsTable clientes={CLIENTES} canEdit={true} onEdit={vi.fn()} />);

    expect(screen.getByText('Ana Soto')).toBeInTheDocument();
    expect(screen.getByText('Luces SpA')).toBeInTheDocument();
    expect(screen.getByText('+56911111111')).toBeInTheDocument();
  });

  test('sin clientes, muestra el estado vacío', () => {
    render(<ClientsTable clientes={[]} canEdit={true} onEdit={vi.fn()} />);

    expect(screen.getByText('Sin resultados.')).toBeInTheDocument();
  });

  test('canEdit=false oculta el botón Editar', () => {
    render(<ClientsTable clientes={CLIENTES} canEdit={false} onEdit={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  test('click en Editar llama a onEdit con el cliente de la fila', async () => {
    const onEdit = vi.fn();
    render(<ClientsTable clientes={CLIENTES} canEdit={true} onEdit={onEdit} />);

    const filas = screen.getAllByRole('button', { name: /editar/i });
    await userEvent.click(filas[1]);

    expect(onEdit).toHaveBeenCalledWith(CLIENTES[1]);
  });
});
