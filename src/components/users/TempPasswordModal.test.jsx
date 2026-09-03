import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TempPasswordModal } from './TempPasswordModal';

describe('TempPasswordModal', () => {
  test('muestra el nombre del usuario y la contraseña temporal', () => {
    render(<TempPasswordModal usuario={{ nombre: 'Ana Soto' }} contrasenaTemp="a1b2c3d4" onClose={vi.fn()} />);

    expect(screen.getByText(/ana soto/i)).toBeInTheDocument();
    expect(screen.getByText('a1b2c3d4')).toBeInTheDocument();
  });

  test('advierte que no se volverá a mostrar', () => {
    render(<TempPasswordModal usuario={{ nombre: 'Ana' }} contrasenaTemp="a1b2c3d4" onClose={vi.fn()} />);
    expect(screen.getByText(/no se volverá a mostrar/i)).toBeInTheDocument();
  });

  test('el botón copiar deja la contraseña en el portapapeles', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    render(<TempPasswordModal usuario={{ nombre: 'Ana' }} contrasenaTemp="a1b2c3d4" onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /copiar/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('a1b2c3d4'));
    expect(await screen.findByText(/copiada/i)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  test('si el navegador bloquea el portapapeles, la clave sigue visible y avisa', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });

    render(<TempPasswordModal usuario={{ nombre: 'Ana' }} contrasenaTemp="a1b2c3d4" onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /copiar/i }));

    expect(await screen.findByText(/no se pudo copiar/i)).toBeInTheDocument();
    expect(screen.getByText('a1b2c3d4')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  test('cerrar exige un click explícito', async () => {
    const onClose = vi.fn();
    render(<TempPasswordModal usuario={{ nombre: 'Ana' }} contrasenaTemp="a1b2c3d4" onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /entendido/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
