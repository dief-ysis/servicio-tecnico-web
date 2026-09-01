import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adjustStock } from '../../api/parts';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';

const SERVER_ERROR_MESSAGES = {
  stock_insuficiente: 'No hay stock suficiente para este ajuste.',
  sin_permiso: 'No tienes permiso para ajustar el stock.',
  repuesto_no_encontrado: 'Ese repuesto ya no existe.',
  // La validación del cliente ataja este caso antes de enviar; se mapea igual
  // por si esa validación cambia.
  ajuste_invalido: 'La cantidad debe ser un número entero distinto de cero.',
};

export function StockAdjustModal({ repuesto, onClose }) {
  const queryClient = useQueryClient();
  const [delta, setDelta] = useState('');

  const deltaNum = Number(delta);
  const deltaValido = delta !== '' && Number.isInteger(deltaNum) && deltaNum !== 0;
  const resultante = repuesto.stockActual + (Number.isInteger(deltaNum) ? deltaNum : 0);

  const mutation = useMutation({
    mutationFn: () => adjustStock(repuesto.id, { ajusteStock: deltaNum }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repuestos'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-alertas'] });
      onClose();
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!deltaValido || resultante < 0) return;
    mutation.mutate();
  }

  const serverError = mutation.isError
    ? SERVER_ERROR_MESSAGES[mutation.error.message] || 'No se pudo ajustar el stock.'
    : '';

  return (
    <Modal>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-sm flex flex-col gap-3"
      >
        <h2 className="text-white text-base font-bold">Ajustar stock — {repuesto.nombre}</h2>
        <p className="text-ink-500 text-sm">Stock actual: {repuesto.stockActual}</p>
        <Input
          id="delta"
          label="Cantidad (+ o -)"
          type="number"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
        />
        <p className="text-sm text-white">Stock resultante: {resultante}</p>
        <ErrorBanner message={serverError} />
        <div className="flex gap-2 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!deltaValido || resultante < 0 || mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : 'Confirmar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
