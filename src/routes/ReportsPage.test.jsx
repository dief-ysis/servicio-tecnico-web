import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportsPage } from './ReportsPage';
import { getTiempoTaller, getPendientes, getSinRetiro } from '../api/reports';

vi.mock('../api/reports', () => ({
  getTiempoTaller: vi.fn(), getPendientes: vi.fn(), getSinRetiro: vi.fn(),
}));

const TIEMPO = { promedioHoras: 42.5, porEquipo: [{ idInterno: 'OT-1-1', horas: 48, fechas: {} }] };
const PENDIENTES = {
  porEstado: [{ estado: 'EN_DIAGNOSTICO', total: 3 }],
  equipos: [{ id: 1, idInterno: 'OT-1-1', estado: 'EN_DIAGNOSTICO', clienteNombre: 'Ana', tecnicoNombre: 'Juan' }],
};
const SIN_RETIRO = [{ idInterno: 'OT-2-1', cliente: 'Beto', fechaListoRetiro: '2026-01-01T10:00:00.000Z', diasTranscurridos: 45 }];

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ReportsPage />
    </QueryClientProvider>
  );
}

function mockOk() {
  getTiempoTaller.mockResolvedValue(TIEMPO);
  getPendientes.mockResolvedValue(PENDIENTES);
  getSinRetiro.mockResolvedValue(SIN_RETIRO);
}

describe('ReportsPage', () => {
  test('muestra las tres secciones', async () => {
    mockOk();
    renderPage();

    expect(await screen.findByText(/42,5 h|42.5 h/)).toBeInTheDocument();
    // "En diagnóstico" aparece dos veces y está bien: como etiqueta de la
    // barra y como badge en la tabla de equipos pendientes.
    expect(screen.getAllByText('En diagnóstico')).toHaveLength(2);
    expect(screen.getByTestId('barra-relleno')).toBeInTheDocument();
    expect(await screen.findByText('OT-2-1')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  test('filtrar por rango vuelve a consultar tiempo-taller con las fechas', async () => {
    mockOk();
    renderPage();
    await screen.findByText(/42,5 h|42.5 h/);

    await userEvent.type(screen.getByLabelText('Desde'), '2026-01-01');
    await userEvent.type(screen.getByLabelText('Hasta'), '2026-01-31');
    await userEvent.click(screen.getByRole('button', { name: /aplicar/i }));

    await waitFor(() => expect(getTiempoTaller).toHaveBeenLastCalledWith({
      desde: '2026-01-01', hasta: '2026-01-31',
    }));
  });

  test('rango invertido se avisa sin llamar al backend', async () => {
    mockOk();
    renderPage();
    await screen.findByText(/42,5 h|42.5 h/);
    getTiempoTaller.mockClear();

    await userEvent.type(screen.getByLabelText('Desde'), '2026-06-01');
    await userEvent.type(screen.getByLabelText('Hasta'), '2026-01-01');
    await userEvent.click(screen.getByRole('button', { name: /aplicar/i }));

    expect(await screen.findByText(/no puede ser posterior/i)).toBeInTheDocument();
    expect(getTiempoTaller).not.toHaveBeenCalled();
  });

  test('sin datos en el período no muestra un cero engañoso', async () => {
    mockOk();
    getTiempoTaller.mockResolvedValue({ promedioHoras: null, porEquipo: [] });
    renderPage();

    expect(await screen.findByText(/sin equipos terminados/i)).toBeInTheDocument();
  });

  // Que falle un reporte no debe vaciar los otros dos.
  test('si falla un reporte, los otros dos siguen mostrándose', async () => {
    mockOk();
    getPendientes.mockImplementation(() => Promise.reject(new Error('fallo_red')));
    renderPage();

    expect(await screen.findByText(/no se pudo cargar el reporte de pendientes/i)).toBeInTheDocument();
    expect(await screen.findByText(/42,5 h|42.5 h/)).toBeInTheDocument();
    expect(await screen.findByText('OT-2-1')).toBeInTheDocument();
  });

  test('sin equipos sin retiro muestra el estado vacío', async () => {
    mockOk();
    getSinRetiro.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/no hay equipos sin retirar/i)).toBeInTheDocument();
  });
});
