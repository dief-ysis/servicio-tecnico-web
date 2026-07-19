import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  test('TECNICO no ve Clientes ni Usuarios', () => {
    useAuth.mockReturnValue({ usuario: { rol: 'TECNICO' } });
    render(<MemoryRouter><Sidebar /></MemoryRouter>);

    expect(screen.queryByTitle('Clientes')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Usuarios')).not.toBeInTheDocument();
    expect(screen.getByTitle('Equipos')).toBeInTheDocument();
  });

  test('ADMIN ve todas las secciones', () => {
    useAuth.mockReturnValue({ usuario: { rol: 'ADMIN' } });
    render(<MemoryRouter><Sidebar /></MemoryRouter>);

    expect(screen.getByTitle('Clientes')).toBeInTheDocument();
    expect(screen.getByTitle('Usuarios')).toBeInTheDocument();
    expect(screen.getByTitle('Reportes')).toBeInTheDocument();
  });
});
