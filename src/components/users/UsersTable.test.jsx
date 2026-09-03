import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersTable } from './UsersTable';

const USUARIOS = [
  { id: 1, nombre: 'Admin Uno', identificador_acceso: 'admin@taller.cl', rol: 'ADMIN', activo: true },
  { id: 2, nombre: 'Tec Dos', identificador_acceso: 'tec@taller.cl', rol: 'TECNICO', activo: true },
  { id: 3, nombre: 'Baja Tres', identificador_acceso: 'baja@taller.cl', rol: 'RECEPCION', activo: false },
];

function renderTable(props = {}) {
  return render(
    <UsersTable
      usuarios={USUARIOS}
      usuarioActualId={1}
      onEdit={vi.fn()}
      onToggleActivo={vi.fn()}
      {...props}
    />
  );
}

describe('UsersTable', () => {
  test('lista los usuarios con su identificador, rol y estado', () => {
    renderTable();

    expect(screen.getByText('Admin Uno')).toBeInTheDocument();
    expect(screen.getByText('admin@taller.cl')).toBeInTheDocument();
    // Dos usuarios activos y uno inactivo en el fixture.
    expect(screen.getAllByText('Activo')).toHaveLength(2);
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  test('sin usuarios muestra el estado vacío', () => {
    renderTable({ usuarios: [] });
    expect(screen.getByText('Sin resultados.')).toBeInTheDocument();
  });

  test('el usuario inactivo ofrece "Activar" y el activo "Desactivar"', () => {
    renderTable();
    expect(screen.getByRole('button', { name: /^activar$/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^desactivar$/i }).length).toBeGreaterThan(0);
  });

  // La guarda: el backend rechaza con 422 que un admin se desactive o cambie
  // su propio rol, y la UI no debe siquiera ofrecerlo.
  test('en la fila propia, editar y desactivar están deshabilitados', () => {
    renderTable();
    const filaPropia = screen.getByText('Admin Uno').closest('tr');

    const botones = [...filaPropia.querySelectorAll('button')];
    expect(botones.length).toBeGreaterThan(0);
    for (const b of botones) expect(b).toBeDisabled();
    expect(filaPropia.querySelector('button[title]')).toHaveAttribute(
      'title',
      expect.stringMatching(/propia cuenta/i)
    );
  });

  test('en la fila de otro usuario, las acciones sí funcionan', async () => {
    const onEdit = vi.fn();
    const onToggleActivo = vi.fn();
    renderTable({ onEdit, onToggleActivo });
    const otraFila = screen.getByText('Tec Dos').closest('tr');

    await userEvent.click([...otraFila.querySelectorAll('button')].find((b) => /editar/i.test(b.textContent)));
    expect(onEdit).toHaveBeenCalledWith(USUARIOS[1]);

    await userEvent.click([...otraFila.querySelectorAll('button')].find((b) => /desactivar/i.test(b.textContent)));
    expect(onToggleActivo).toHaveBeenCalledWith(USUARIOS[1]);
  });
});
