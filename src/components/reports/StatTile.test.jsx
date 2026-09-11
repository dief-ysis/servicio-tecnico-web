import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatTile } from './StatTile';

describe('StatTile', () => {
  test('muestra la etiqueta y el valor', () => {
    render(<StatTile label="Promedio en taller" valor="42,5 h" />);
    expect(screen.getByText('Promedio en taller')).toBeInTheDocument();
    expect(screen.getByText('42,5 h')).toBeInTheDocument();
  });

  test('sin valor muestra el texto alternativo, no un cero engañoso', () => {
    render(<StatTile label="Promedio en taller" valor={null} vacio="Sin equipos terminados en este período." />);
    expect(screen.getByText(/sin equipos terminados/i)).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
