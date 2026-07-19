import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, updateClient } from '../../api/clients';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ErrorBanner } from '../ui/ErrorBanner';

const SERVER_ERROR_MESSAGES = {
  telefono_requerido: 'El teléfono es requerido.',
  nombre_o_empresa_requerido: 'Debes indicar nombre o empresa.',
};

export function ClientFormModal({ cliente, onClose }) {
  const isEdit = Boolean(cliente);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nombre: cliente?.nombre ?? '',
    empresa: cliente?.empresa ?? '',
    telefono: cliente?.telefono ?? '',
    correo: cliente?.correo ?? '',
    rut: cliente?.rut ?? '',
  });
  const [validationError, setValidationError] = useState('');

  const mutation = useMutation({
    mutationFn: (payload) => (isEdit ? updateClient(cliente.id, payload) : createClient(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      onClose();
    },
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError('');

    if (!form.telefono) {
      setValidationError('El teléfono es requerido.');
      return;
    }
    if (!form.nombre && !form.empresa) {
      setValidationError('Debes indicar nombre o empresa.');
      return;
    }

    mutation.mutate({
      nombre: form.nombre || null,
      empresa: form.empresa || null,
      telefono: form.telefono,
      correo: form.correo || null,
      rut: form.rut || null,
    });
  }

  const serverError = mutation.isError
    ? SERVER_ERROR_MESSAGES[mutation.error.message] || 'No se pudo guardar el cliente.'
    : '';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-sm flex flex-col gap-3"
      >
        <h2 className="text-white text-base font-bold">{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <Input id="nombre" label="Nombre" value={form.nombre} onChange={(e) => updateField('nombre', e.target.value)} />
        <Input id="empresa" label="Empresa" value={form.empresa} onChange={(e) => updateField('empresa', e.target.value)} />
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
    </div>
  );
}
