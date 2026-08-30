import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EquipmentDetailPage } from './EquipmentDetailPage';
import { getEquipmentById, updateEquipmentState, assignTechnician, submitBudget } from '../api/equipment';
import { getUsers } from '../api/users';

vi.mock('../api/equipment', () => ({
  getEquipmentById: vi.fn(),
  updateEquipmentState: vi.fn(),
  assignTechnician: vi.fn(),
  submitBudget: vi.fn(),
}));
vi.mock('../api/users', () => ({
  getUsers: vi.fn(),
}));

const USUARIOS = [{ id: 1, nombre: 'Juan Pérez', rol: 'TECNICO' }];

function baseEquipo(overrides = {}) {
  return {
    id: 5,
    idInterno: 'EQ-0005',
    estado: 'EN_DIAGNOSTICO',
    tipoModelo: 'Mixer Behringer X32',
    marca: 'Behringer',
    numeroSerie: 'SN123',
    fallaReportada: 'No enciende',
    accesorios: null,
    presupuestoMonto: null,
    presupuestoDescripcion: null,
    presupuestoAprobado: false,
    tecnicoAsignadoId: null,
    tecnicoNombre: null,
    ordenId: 7,
    orden: { fechaIngreso: '2026-07-20T15:00:00.000Z', recepcionistaNombre: 'Carla Ríos' },
    cliente: { id: 1, nombre: 'Ana Soto', empresa: null, telefono: '+56911111111' },
    historial: [],
    ...overrides,
  };
}

function renderPage(id = '5') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/equipos/${id}`]}>
        <Routes>
          <Route path="/equipos/:id" element={<EquipmentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('EquipmentDetailPage', () => {
  beforeEach(() => {
    getEquipmentById.mockReset();
    updateEquipmentState.mockReset();
    assignTechnician.mockReset();
    submitBudget.mockReset();
    getUsers.mockReset();
    getUsers.mockResolvedValue(USUARIOS);
  });

  test('muestra los datos del equipo y del cliente', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());

    renderPage();

    expect(await screen.findByText('EQ-0005')).toBeInTheDocument();
    expect(screen.getByText('Mixer Behringer X32')).toBeInTheDocument();
    expect(screen.getByText('Ana Soto')).toBeInTheDocument();
  });

  test('cambiar a un estado válido llama a updateEquipmentState y refresca', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());
    updateEquipmentState.mockResolvedValue({ id: 5, estado: 'EN_REPARACION' });

    renderPage();
    await screen.findByText('EQ-0005');

    await userEvent.selectOptions(screen.getByLabelText('Nuevo estado'), 'EN_REPARACION');
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() =>
      expect(updateEquipmentState).toHaveBeenCalledWith('5', { estado: 'EN_REPARACION', motivo: undefined })
    );
  });

  test('marcar NO_REPARABLE sin motivo no llama al backend y muestra error', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());

    renderPage();
    await screen.findByText('EQ-0005');

    await userEvent.selectOptions(screen.getByLabelText('Nuevo estado'), 'NO_REPARABLE');
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByText(/debes indicar un motivo/i)).toBeInTheDocument();
    expect(updateEquipmentState).not.toHaveBeenCalled();
  });

  test('transición rechazada por el backend muestra el mensaje de error', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());
    updateEquipmentState.mockRejectedValue(new Error('transicion_no_permitida'));

    renderPage();
    await screen.findByText('EQ-0005');

    await userEvent.selectOptions(screen.getByLabelText('Nuevo estado'), 'EN_REPARACION');
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(screen.getByText('Esa transición de estado no está permitida.')).toBeInTheDocument();
    });
  });

  test('asignar técnico llama a assignTechnician con el id numérico', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());
    assignTechnician.mockResolvedValue({ id: 5, tecnicoAsignadoId: 1 });

    renderPage();
    await screen.findByText('EQ-0005');

    await userEvent.selectOptions(screen.getByLabelText('Técnico'), 'Juan Pérez');

    await waitFor(() => expect(assignTechnician).toHaveBeenCalledWith('5', { tecnicoId: 1 }));
  });

  test('el formulario de presupuesto solo se muestra en EN_DIAGNOSTICO', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo({ estado: 'EN_REPARACION' }));

    renderPage();
    await screen.findByText('EQ-0005');

    expect(screen.queryByRole('button', { name: /enviar presupuesto/i })).not.toBeInTheDocument();
  });

  test('enviar presupuesto válido llama a submitBudget', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());
    submitBudget.mockResolvedValue({ id: 5, estado: 'ESPERANDO_APROBACION' });

    renderPage();
    await screen.findByText('EQ-0005');

    await userEvent.type(screen.getByLabelText('Monto'), '15000');
    await userEvent.type(screen.getByLabelText('Descripción'), 'Cambio de fuente');
    await userEvent.click(screen.getByRole('button', { name: /enviar presupuesto/i }));

    await waitFor(() =>
      expect(submitBudget).toHaveBeenCalledWith('5', { monto: 15000, descripcion: 'Cambio de fuente' })
    );
  });
});
