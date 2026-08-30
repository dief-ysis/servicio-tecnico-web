import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, updateClient } from '../../api/clients';
import { isValidEmail, isValidRut } from '../../lib/validators';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';

const SERVER_ERROR_MESSAGES = {
  telefono_requerido: 'El teléfono es requerido.',
  nombre_o_empresa_requerido: 'Debes indicar nombre o empresa.',
  correo_invalido: 'El correo no tiene un formato válido.',
  rut_invalido: 'El RUT no es válido.',
};

export function ClientFormModal({ cliente, onClose, onSaved }) {
  const isEdit = Boolean(cliente);
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState(cliente?.empresa ? 'EMPRESA' : 'PERSONA');
  const [form, setForm] = useState({
    nombreOEmpresa: cliente?.empresa || cliente?.nombre || '',
    telefono: cliente?.telefono ?? '',
    correo: cliente?.correo ?? '',
    rut: cliente?.rut ?? '',
  });
  const [validationError, setValidationError] = useState('');

  const mutation = useMutation({
    mutationFn: (payload) => (isEdit ? updateClient(cliente.id, payload) : createClient(payload)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      onSaved?.(data);
      onClose();
    },
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    setValidationError('');

    if (!form.telefono) {
      setValidationError('El teléfono es requerido.');
      return;
    }
    if (!form.nombreOEmpresa) {
      setValidationError('Debes indicar nombre o empresa.');
      return;
    }
    if (form.correo && !isValidEmail(form.correo)) {
      setValidationError('El correo no tiene un formato válido.');
      return;
    }
    if (form.rut && !isValidRut(form.rut)) {
      setValidationError('El RUT no es válido.');
      return;
    }

    mutation.mutate({
      nombre: tipo === 'PERSONA' ? form.nombreOEmpresa : null,
      empresa: tipo === 'EMPRESA' ? form.nombreOEmpresa : null,
      telefono: form.telefono,
      correo: form.correo || null,
      rut: form.rut || null,
    });
  }

  const serverError = mutation.isError
    ? SERVER_ERROR_MESSAGES[mutation.error.message] || 'No se pudo guardar el cliente.'
    : '';

  return (
    <Modal>
      <form
        onSubmit={handleSubmit}
        className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-sm flex flex-col gap-3"
      >
        <h2 className="text-white text-base font-bold">{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <div className="flex gap-4 text-sm text-ink-500">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="tipo-cliente"
              value="PERSONA"
              checked={tipo === 'PERSONA'}
              onChange={() => setTipo('PERSONA')}
              className="accent-gold"
            />
            Persona
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="tipo-cliente"
              value="EMPRESA"
              checked={tipo === 'EMPRESA'}
              onChange={() => setTipo('EMPRESA')}
              className="accent-gold"
            />
            Empresa
          </label>
        </div>
        <Input
          id="nombreOEmpresa"
          label={tipo === 'PERSONA' ? 'Nombre' : 'Nombre de la empresa'}
          value={form.nombreOEmpresa}
          onChange={(e) => updateField('nombreOEmpresa', e.target.value)}
        />
        <Input id="telefono" label="Teléfono" value={form.telefono} onChange={(e) => updateField('telefono', e.target.value)} />
        <Input id="correo" label="Correo" value={form.correo} onChange={(e) => updateField('correo', e.target.value)} />
        <Input id="rut" label="RUT" value={form.rut} onChange={(e) => updateField('rut', e.target.value)} />
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
