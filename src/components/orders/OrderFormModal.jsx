import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder, getReceiptBlob } from '../../api/orders';
import { openReceiptInNewTab } from '../../lib/receipt';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';
import { ClientPicker } from './ClientPicker';

const EMPTY_EQUIPO = {
  tipoModelo: '',
  marca: '',
  numeroSerie: '',
  fallaReportada: '',
  accesorios: '',
  requierePresupuesto: false,
};

const SERVER_ERROR_MESSAGES = {
  cliente_id_requerido: 'Debes seleccionar un cliente.',
  equipos_requeridos: 'Debes agregar al menos un equipo.',
  tipo_modelo_requerido: 'El tipo/modelo es requerido en todos los equipos.',
  falla_reportada_requerida: 'La falla reportada es requerida en todos los equipos.',
  cliente_no_encontrado: 'El cliente seleccionado ya no existe.',
};

export function OrderFormModal({ onClose }) {
  const queryClient = useQueryClient();
  const [cliente, setCliente] = useState(null);
  const [equipos, setEquipos] = useState([{ ...EMPTY_EQUIPO }]);
  const [validationError, setValidationError] = useState('');

  const mutation = useMutation({
    mutationFn: (payload) => createOrder(payload),
    onSuccess: async (orden) => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      try {
        const blob = await getReceiptBlob(orden.id);
        openReceiptInNewTab(blob);
      } catch {
        // La orden ya se creó; el comprobante se puede reimprimir después
        // desde el detalle de la orden. No bloquear el cierre del modal.
      }
      onClose();
    },
  });

  function updateEquipo(index, field, value) {
    setEquipos((prev) => prev.map((eq, i) => (i === index ? { ...eq, [field]: value } : eq)));
  }

  function addEquipo() {
    setEquipos((prev) => [...prev, { ...EMPTY_EQUIPO }]);
  }

  function removeEquipo(index) {
    setEquipos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError('');

    if (!cliente) {
      setValidationError('Debes seleccionar un cliente.');
      return;
    }
    for (let i = 0; i < equipos.length; i++) {
      if (!equipos[i].tipoModelo) {
        setValidationError(`Equipo ${i + 1}: el tipo/modelo es requerido.`);
        return;
      }
      if (!equipos[i].fallaReportada) {
        setValidationError(`Equipo ${i + 1}: la falla reportada es requerida.`);
        return;
      }
    }

    mutation.mutate({
      clienteId: cliente.id,
      equipos: equipos.map((eq) => ({
        tipoModelo: eq.tipoModelo,
        marca: eq.marca || null,
        numeroSerie: eq.numeroSerie || null,
        fallaReportada: eq.fallaReportada,
        accesorios: eq.accesorios || null,
        requierePresupuesto: eq.requierePresupuesto,
      })),
    });
  }

  const serverError = mutation.isError
    ? SERVER_ERROR_MESSAGES[mutation.error.message] || 'No se pudo crear la orden.'
    : '';

  return (
    <Modal>
      <form
        onSubmit={handleSubmit}
        className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-lg flex flex-col gap-3"
      >
        <h2 className="text-white text-base font-bold">Nueva orden</h2>

        <ClientPicker cliente={cliente} onChange={setCliente} />

        <div className="flex flex-col gap-4">
          {equipos.map((equipo, index) => (
            <div key={index} className="border border-ink-700 rounded-md p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500 font-semibold">Equipo {index + 1}</span>
                {equipos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEquipo(index)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <Input
                id={`tipoModelo-${index}`}
                label="Tipo / modelo"
                value={equipo.tipoModelo}
                onChange={(e) => updateEquipo(index, 'tipoModelo', e.target.value)}
              />
              <Input
                id={`marca-${index}`}
                label="Marca"
                value={equipo.marca}
                onChange={(e) => updateEquipo(index, 'marca', e.target.value)}
              />
              <Input
                id={`numeroSerie-${index}`}
                label="N° de serie"
                value={equipo.numeroSerie}
                onChange={(e) => updateEquipo(index, 'numeroSerie', e.target.value)}
              />
              <Textarea
                id={`fallaReportada-${index}`}
                label="Falla reportada"
                value={equipo.fallaReportada}
                onChange={(e) => updateEquipo(index, 'fallaReportada', e.target.value)}
              />
              <Textarea
                id={`accesorios-${index}`}
                label="Accesorios"
                value={equipo.accesorios}
                onChange={(e) => updateEquipo(index, 'accesorios', e.target.value)}
              />
              <Checkbox
                id={`requierePresupuesto-${index}`}
                label="Presupuesto bloqueante"
                checked={equipo.requierePresupuesto}
                onChange={(e) => updateEquipo(index, 'requierePresupuesto', e.target.checked)}
              />
            </div>
          ))}
        </div>

        <Button type="button" variant="secondary" onClick={addEquipo}>
          + Agregar equipo
        </Button>

        <ErrorBanner message={validationError || serverError} />

        <div className="flex gap-2 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
