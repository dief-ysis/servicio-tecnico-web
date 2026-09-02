import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TrackingPage } from './TrackingPage';
import { consultarSeguimiento } from '../api/tracking';

vi.mock('../api/tracking', () => ({ consultarSeguimiento: vi.fn() }));

const MENSAJE_NEUTRO = /no encontramos equipos en proceso con ese código/i;

const EQUIPOS = [
  { idInterno: 'OT-7-1', estado: 'EN_DIAGNOSTICO', fechaUltimoCambio: '2026-09-01T13:00:00.000Z', notas: [] },
];

function renderPage(ruta = '/seguimiento') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/seguimiento" element={<TrackingPage />} />
        <Route path="/seguimiento/:codigo" element={<TrackingPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TrackingPage', () => {
  test('consultar desde el formulario lista los equipos', async () => {
    consultarSeguimiento.mockResolvedValue({ equipos: EQUIPOS });
    renderPage();

    await userEvent.type(screen.getByLabelText(/código/i), 'abc123');
    await userEvent.click(screen.getByRole('button', { name: /consultar/i }));

    await waitFor(() => expect(consultarSeguimiento).toHaveBeenCalledWith('abc123'));
    expect(await screen.findByText('OT-7-1')).toBeInTheDocument();
    expect(screen.getByText('En diagnóstico')).toBeInTheDocument();
  });

  test('entrar por /seguimiento/:codigo precarga el input y consulta sola', async () => {
    consultarSeguimiento.mockResolvedValue({ equipos: EQUIPOS });
    renderPage('/seguimiento/xyz789');

    await waitFor(() => expect(consultarSeguimiento).toHaveBeenCalledWith('xyz789'));
    expect(await screen.findByText('OT-7-1')).toBeInTheDocument();
    expect(screen.getByLabelText(/código/i)).toHaveValue('xyz789');
  });

  // ESTE test protege el anti-enumeración: el backend responde igual para
  // "código inexistente" y "sin equipos en proceso", y la UI no debe
  // distinguirlos. Si alguien "mejora" el mensaje, este test lo frena.
  test('lista vacía muestra el mensaje neutro, sin insinuar que el código sea inválido', async () => {
    consultarSeguimiento.mockResolvedValue({ equipos: [] });
    renderPage('/seguimiento/loquesea');

    expect(await screen.findByText(MENSAJE_NEUTRO)).toBeInTheDocument();
    const cuerpo = document.body.textContent.toLowerCase();
    for (const prohibido of ['inválido', 'invalido', 'no existe', 'incorrecto', 'no encontrado']) {
      expect(cuerpo).not.toContain(prohibido);
    }
  });

  test('429 muestra el mensaje de demasiadas consultas', async () => {
    consultarSeguimiento.mockImplementation(() => Promise.reject(new Error('demasiados_intentos')));
    renderPage('/seguimiento/abc');

    expect(await screen.findByText(/demasiadas consultas/i)).toBeInTheDocument();
  });

  test('fallo de red muestra el mensaje de conexión', async () => {
    consultarSeguimiento.mockImplementation(() => Promise.reject(new Error('fallo_red')));
    renderPage('/seguimiento/abc');

    expect(await screen.findByText(/no pudimos conectar/i)).toBeInTheDocument();
  });

  test('enviar el formulario vacío no consulta al backend', async () => {
    consultarSeguimiento.mockClear();
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /consultar/i }));

    expect(consultarSeguimiento).not.toHaveBeenCalled();
  });

  test('sin consultar todavía no muestra ni resultados ni el mensaje neutro', () => {
    renderPage();

    expect(screen.queryByText(MENSAJE_NEUTRO)).not.toBeInTheDocument();
    expect(screen.queryByText('OT-7-1')).not.toBeInTheDocument();
  });
});
