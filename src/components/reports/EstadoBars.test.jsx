import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EstadoBars } from './EstadoBars';

const DATOS = [
  { estado: 'EN_DIAGNOSTICO', total: 8 },
  { estado: 'EN_REPARACION', total: 4 },
  { estado: 'NO_REPARABLE', total: 1 },
];

describe('EstadoBars', () => {
  test('traduce los estados y muestra el conteo de cada uno', () => {
    render(<EstadoBars datos={DATOS} />);

    expect(screen.getByText('En diagnóstico')).toBeInTheDocument();
    expect(screen.getByText('En reparación')).toBeInTheDocument();
    expect(screen.getByText('No reparable')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('el ancho de cada barra es proporcional al máximo', () => {
    render(<EstadoBars datos={DATOS} />);
    const barras = screen.getAllByTestId('barra-relleno');

    // 8 es el máximo -> 100%; 4 -> 50%; 1 -> 12.5%
    expect(barras[0]).toHaveStyle({ width: '100%' });
    expect(barras[1]).toHaveStyle({ width: '50%' });
    expect(barras[2]).toHaveStyle({ width: '12.5%' });
  });

  test('una sola serie: todas las barras comparten el mismo color', () => {
    render(<EstadoBars datos={DATOS} />);
    const colores = screen.getAllByTestId('barra-relleno').map((b) => b.className);
    expect(new Set(colores).size).toBe(1);
  });

  test('sin datos muestra un mensaje en vez de un gráfico vacío', () => {
    render(<EstadoBars datos={[]} />);
    expect(screen.getByText(/no hay equipos pendientes/i)).toBeInTheDocument();
    expect(screen.queryByTestId('barra-relleno')).not.toBeInTheDocument();
  });

  test('un total de 0 no rompe el cálculo de proporciones', () => {
    render(<EstadoBars datos={[{ estado: 'RECIBIDO', total: 0 }]} />);
    expect(screen.getByTestId('barra-relleno')).toHaveStyle({ width: '0%' });
  });
});
