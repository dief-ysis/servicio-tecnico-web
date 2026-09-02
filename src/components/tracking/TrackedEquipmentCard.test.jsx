import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrackedEquipmentCard } from './TrackedEquipmentCard';

const base = {
  idInterno: 'OT-7-1',
  estado: 'EN_DIAGNOSTICO',
  fechaUltimoCambio: '2026-09-01T13:00:00.000Z',
  notas: [],
};

describe('TrackedEquipmentCard', () => {
  test('muestra el id interno y el estado en español, no el enum crudo', () => {
    render(<TrackedEquipmentCard equipo={base} />);

    expect(screen.getByText('OT-7-1')).toBeInTheDocument();
    expect(screen.getByText('En diagnóstico')).toBeInTheDocument();
    expect(screen.queryByText('EN_DIAGNOSTICO')).not.toBeInTheDocument();
  });

  test('muestra la fecha del último cambio', () => {
    render(<TrackedEquipmentCard equipo={base} />);
    expect(screen.getByText(/01-09-2026/)).toBeInTheDocument();
  });

  test('lista las notas visibles en orden', () => {
    render(<TrackedEquipmentCard equipo={{ ...base, notas: [
      { texto: 'Equipo recibido en taller', fecha: '2026-09-01T10:00:00.000Z' },
      { texto: 'Esperando repuesto', fecha: '2026-09-01T12:00:00.000Z' },
    ] }} />);

    const notas = screen.getAllByTestId('nota');
    expect(notas.map((n) => n.textContent)).toEqual([
      expect.stringContaining('Equipo recibido en taller'),
      expect.stringContaining('Esperando repuesto'),
    ]);
  });

  test('sin notas no renderiza la sección ni un encabezado vacío', () => {
    render(<TrackedEquipmentCard equipo={base} />);

    expect(screen.queryByTestId('nota')).not.toBeInTheDocument();
    expect(screen.queryByText(/actualizaciones/i)).not.toBeInTheDocument();
  });

  test('NO_REPARABLE también se muestra traducido (el equipo sigue en el taller)', () => {
    render(<TrackedEquipmentCard equipo={{ ...base, estado: 'NO_REPARABLE' }} />);
    expect(screen.getByText('No reparable')).toBeInTheDocument();
  });
});
