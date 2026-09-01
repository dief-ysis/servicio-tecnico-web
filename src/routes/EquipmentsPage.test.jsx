import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EquipmentsPage } from './EquipmentsPage';
import { getEquipment } from '../api/equipment';
import { getUsers } from '../api/users';

vi.mock('../api/equipment', () => ({
  getEquipment: vi.fn(),
}));
vi.mock('../api/users', () => ({
  getUsers: vi.fn(),
}));

const EQUIPOS = [
  {
    id: 1,
    idInterno: 'EQ-0001',
    estado: 'RECIBIDO',
    tipoModelo: 'Mixer Behringer X32',
    marca: 'Behringer',
    ordenId: 7,
    clienteNombre: 'Ana Soto',
    tecnicoNombre: null,
  },
];

const USUARIOS = [
  { id: 1, nombre: 'Juan Pérez', rol: 'TECNICO', activo: true },
  { id: 2, nombre: 'Carla Ríos', rol: 'RECEPCION', activo: true },
  { id: 3, nombre: 'Pedro Soto', rol: 'TECNICO', activo: false },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EquipmentsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('EquipmentsPage', () => {
  beforeEach(() => {
    getEquipment.mockReset();
    getUsers.mockReset();
    getUsers.mockResolvedValue(USUARIOS);
  });

  test('muestra los equipos que devuelve getEquipment', async () => {
    getEquipment.mockResolvedValue(EQUIPOS);

    renderPage();

    expect(await screen.findByText('Ana Soto')).toBeInTheDocument();
  });

  test('solo lista usuarios con rol TECNICO en el filtro de técnico', async () => {
    getEquipment.mockResolvedValue(EQUIPOS);

    renderPage();
    await screen.findByText('Ana Soto');

    expect(screen.getByRole('option', { name: 'Juan Pérez' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Carla Ríos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Pedro Soto' })).not.toBeInTheDocument();
  });

  test('muestra ErrorBanner cuando getUsers falla, sin romper el filtro de estado', async () => {
    getEquipment.mockResolvedValue(EQUIPOS);
    getUsers.mockRejectedValue(new Error('sin_permiso'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la lista de técnicos para el filtro.')).toBeInTheDocument();
    });
    expect(await screen.findByText('Ana Soto')).toBeInTheDocument();
  });

  test('escribir en el buscador termina consultando getEquipment con el término (debounced)', async () => {
    getEquipment.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(getEquipment).toHaveBeenCalledTimes(1));

    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'dmx');

    await waitFor(
      () => expect(getEquipment).toHaveBeenLastCalledWith({ buscar: 'dmx', estado: '', tecnico: '' }),
      { timeout: 1000 }
    );
  });

  test('elegir un estado en el filtro consulta getEquipment con ese estado', async () => {
    getEquipment.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(getEquipment).toHaveBeenCalledTimes(1));

    await userEvent.selectOptions(screen.getByDisplayValue('Todos los estados'), 'EN_DIAGNOSTICO');

    await waitFor(() =>
      expect(getEquipment).toHaveBeenLastCalledWith({ buscar: '', estado: 'EN_DIAGNOSTICO', tecnico: '' })
    );
  });

  test('elegir un técnico en el filtro consulta getEquipment con su id', async () => {
    getEquipment.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(getEquipment).toHaveBeenCalledTimes(1));
    // El selector se puebla con getUsers, así que hay que esperar a que llegue.
    await screen.findByRole('option', { name: 'Juan Pérez' });

    await userEvent.selectOptions(screen.getByDisplayValue('Todos los técnicos'), 'Juan Pérez');

    await waitFor(() =>
      expect(getEquipment).toHaveBeenLastCalledWith({ buscar: '', estado: '', tecnico: '1' })
    );
  });

  test('muestra ErrorBanner cuando getEquipment falla sin crash del componente', async () => {
    getEquipment.mockRejectedValue(new Error('fallo_red'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la lista de equipos.')).toBeInTheDocument();
    });
  });
});
