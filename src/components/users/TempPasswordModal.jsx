import { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

// El backend genera la contraseña temporal y la guarda hasheada: este es el
// único momento en que existe en claro. Si se pierde acá, el usuario nuevo no
// puede entrar y hay que borrarlo y volver a crearlo (no hay endpoint de
// reseteo). De ahí el modal dedicado, el botón de copiar y el cierre explícito.
export function TempPasswordModal({ usuario, contrasenaTemp, onClose }) {
  const [copia, setCopia] = useState('');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(contrasenaTemp);
      setCopia('Contraseña copiada.');
    } catch {
      // Sin HTTPS o sin permiso, la Clipboard API falla. No es grave: la
      // contraseña sigue visible en pantalla para copiarla a mano.
      setCopia('No se pudo copiar. Selecciónala y cópiala a mano.');
    }
  }

  return (
    <Modal>
      <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-sm flex flex-col gap-3">
        <h2 className="text-white text-base font-bold">Usuario creado</h2>
        <p className="text-ink-500 text-sm">
          Entrégale esta contraseña temporal a <span className="text-white">{usuario?.nombre}</span>.
          Se la pedirá cambiar en el primer ingreso.
        </p>

        <p className="bg-ink-800 border border-ink-700 rounded-md px-3 py-3 text-center text-lg font-mono text-gold break-all">
          {contrasenaTemp}
        </p>

        <p className="text-red-300 text-xs">
          Anótala ahora: no se volverá a mostrar.
        </p>

        {copia && <p className="text-ink-500 text-xs">{copia}</p>}

        <div className="flex gap-2 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={copiar}>
            Copiar
          </Button>
          <Button type="button" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </Modal>
  );
}
