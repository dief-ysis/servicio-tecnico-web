import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OrdersTable } from './OrdersTable';

const ORDENES = [
  {
    id: 1,
    fechaIngreso: '2026-07-20T15:00:00.000Z',
    cliente: { id: 1, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111' },
    totalEquipos: 2,
  },
  {
    id: 2,
    fechaIngreso: '2026-07-21T10:00:00.000Z',
    cliente: { id: 2, nombre: null, empresa: 'Luces SpA', telefono: '+56922222222' },
    totalEquipos: 1,
  },
];

function renderTable(ordenes) {
  return render(
    <MemoryRouter>
      <OrdersTable ordenes={ordenes} />
    </MemoryRouter>
  );
}

describe('OrdersTable', () => {
  test('renderiza una fila por orden con cliente y cantidad de equipos', () => {
    renderTable(ORDENES);

    expect(screen.getByText('Ana Soto')).toBeInTheDocument();
    expect(screen.getByText('Luces SpA')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('sin órdenes, muestra el estado vacío', () => {
    renderTable([]);

    expect(screen.getByText('Sin resultados.')).toBeInTheDocument();
  });

  test('el cliente enlaza al detalle de la orden', () => {
    renderTable(ORDENES);

    expect(screen.getByRole('link', { name: 'Ana Soto' })).toHaveAttribute('href', '/ordenes/1');
  });
});
