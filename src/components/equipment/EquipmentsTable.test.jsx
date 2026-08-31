import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EquipmentsTable } from './EquipmentsTable';

const EQUIPOS = [
  {
    id: 1,
    idInterno: 'EQ-0001',
    estado: 'EN_DIAGNOSTICO',
    tipoModelo: 'Mixer Behringer X32',
    marca: 'Behringer',
    ordenId: 7,
    clienteNombre: 'Ana Soto',
    tecnicoNombre: 'Juan Pérez',
  },
  {
    id: 2,
    idInterno: 'EQ-0002',
    estado: 'RECIBIDO',
    tipoModelo: 'Parlante JBL',
    marca: null,
    ordenId: 8,
    clienteNombre: 'Luces SpA',
    tecnicoNombre: null,
  },
];

function renderTable(equipos) {
  return render(
    <MemoryRouter>
      <EquipmentsTable equipos={equipos} />
    </MemoryRouter>
  );
}

describe('EquipmentsTable', () => {
  test('renderiza una fila por equipo con cliente, estado y técnico', () => {
    renderTable(EQUIPOS);

    expect(screen.getByText('Ana Soto')).toBeInTheDocument();
    expect(screen.getByText('Luces SpA')).toBeInTheDocument();
    expect(screen.getByText('En diagnóstico')).toBeInTheDocument();
    expect(screen.getByText('Recibido')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  test('sin técnico asignado ni marca, muestra un guion', () => {
    renderTable(EQUIPOS);

    const emDashes = screen.getAllByText('—');
    expect(emDashes.length).toBeGreaterThanOrEqual(2);
  });

  test('sin equipos, muestra el estado vacío', () => {
    renderTable([]);

    expect(screen.getByText('Sin resultados.')).toBeInTheDocument();
  });

  test('el ID interno enlaza al detalle del equipo', () => {
    renderTable(EQUIPOS);

    expect(screen.getByRole('link', { name: 'EQ-0001' })).toHaveAttribute('href', '/equipos/1');
  });
});
