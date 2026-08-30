import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EquipmentDetailPage } from './EquipmentDetailPage';
import {
  getEquipmentById,
  updateEquipmentState,
  assignTechnician,
  submitBudget,
  getPartUsage,
  registerPartUsage,
  reversePartUsage,
} from '../api/equipment';
import { getUsers } from '../api/users';
import { getParts } from '../api/parts';

vi.mock('../api/equipment', () => ({
  getEquipmentById: vi.fn(),
  updateEquipmentState: vi.fn(),
  assignTechnician: vi.fn(),
  submitBudget: vi.fn(),
  getPartUsage: vi.fn(),
  registerPartUsage: vi.fn(),
  reversePartUsage: vi.fn(),
}));
vi.mock('../api/users', () => ({
  getUsers: vi.fn(),
}));
vi.mock('../api/parts', () => ({
  getParts: vi.fn(),
}));

const USUARIOS = [{ id: 1, nombre: 'Juan Pérez', rol: 'TECNICO' }];
const REPUESTOS = [{ id: 3, nombre: 'Fusible 5A', stockActual: 10 }];
const MOVIMIENTOS = [
  { id: 1, repuestoId: 3, repuestoNombre: 'Fusible 5A', cantidad: 2, fecha: '2026-07-22T10:00:00.000Z', usuarioId: 1, usuarioNombre: 'Juan Pérez' },
];

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
    getPartUsage.mockReset();
    registerPartUsage.mockReset();
    reversePartUsage.mockReset();
    getUsers.mockReset();
    getUsers.mockResolvedValue(USUARIOS);
    getParts.mockReset();
    getParts.mockResolvedValue(REPUESTOS);
    getPartUsage.mockResolvedValue([]);
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

  test('registrar un repuesto válido llama a registerPartUsage', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());
    registerPartUsage.mockResolvedValue({ id: 1, stockRestante: 8 });

    renderPage();
    await screen.findByText('EQ-0005');

    await userEvent.selectOptions(screen.getByLabelText('Repuesto'), 'Fusible 5A (stock: 10)');
    await userEvent.type(screen.getByLabelText('Cantidad'), '2');
    await userEvent.click(screen.getByRole('button', { name: /^registrar$/i }));

    await waitFor(() =>
      expect(registerPartUsage).toHaveBeenCalledWith('5', { repuestoId: 3, cantidad: 2 })
    );
  });

  test('stock insuficiente al registrar un repuesto muestra el mensaje de error', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());
    registerPartUsage.mockRejectedValue(new Error('stock_insuficiente'));

    renderPage();
    await screen.findByText('EQ-0005');

    await userEvent.selectOptions(screen.getByLabelText('Repuesto'), 'Fusible 5A (stock: 10)');
    await userEvent.type(screen.getByLabelText('Cantidad'), '100');
    await userEvent.click(screen.getByRole('button', { name: /^registrar$/i }));

    await waitFor(() => {
      expect(screen.getByText('No hay stock suficiente de ese repuesto.')).toBeInTheDocument();
    });
  });

  test('revertir un consumo sin motivo no llama al backend y muestra error', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());
    getPartUsage.mockResolvedValue(MOVIMIENTOS);

    renderPage();
    await screen.findByText('EQ-0005');

    await userEvent.click(screen.getByRole('button', { name: /revertir/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar reversión/i }));

    expect(screen.getByText(/debes indicar un motivo para revertir/i)).toBeInTheDocument();
    expect(reversePartUsage).not.toHaveBeenCalled();
  });

  test('revertir un consumo con motivo llama a reversePartUsage', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());
    getPartUsage.mockResolvedValue(MOVIMIENTOS);
    reversePartUsage.mockResolvedValue({ id: 2, tipo: 'REVERSION' });

    renderPage();
    await screen.findByText('EQ-0005');

    await userEvent.click(screen.getByRole('button', { name: /revertir/i }));
    await userEvent.type(screen.getByLabelText('Motivo de la reversión'), 'No se usó');
    await userEvent.click(screen.getByRole('button', { name: /confirmar reversión/i }));

    await waitFor(() =>
      expect(reversePartUsage).toHaveBeenCalledWith('5', 1, { motivo: 'No se usó' })
    );
  });

  test('revertir un consumo ya revertido muestra el mensaje de error', async () => {
    getEquipmentById.mockResolvedValue(baseEquipo());
    getPartUsage.mockResolvedValue(MOVIMIENTOS);
    reversePartUsage.mockRejectedValue(new Error('ya_revertido'));

    renderPage();
    await screen.findByText('EQ-0005');

    await userEvent.click(screen.getByRole('button', { name: /revertir/i }));
    await userEvent.type(screen.getByLabelText('Motivo de la reversión'), 'No se usó');
    await userEvent.click(screen.getByRole('button', { name: /confirmar reversión/i }));

    await waitFor(() => {
      expect(screen.getByText('Ese consumo ya fue revertido.')).toBeInTheDocument();
    });
  });
});
