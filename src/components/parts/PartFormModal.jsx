import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPart, updatePart } from '../../api/parts';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';

const SERVER_ERROR_MESSAGES = {
  codigo_sku_en_uso: 'Ese código (SKU) ya está en uso.',
  sin_permiso: 'No tienes permiso para modificar el catálogo de repuestos.',
  repuesto_no_encontrado: 'Ese repuesto ya no existe.',
  // Los siguientes los ataja la validación del cliente antes de llegar acá; se
  // mapean igual porque el backend puede devolverlos si esa validación cambia
  // o si la request llega por otra vía.
  nombre_requerido: 'El nombre es requerido.',
  stock_actual_invalido: 'El stock inicial debe ser un número entero mayor o igual a cero.',
  stock_minimo_invalido: 'El stock mínimo debe ser un número entero mayor o igual a cero.',
  activo_invalido: 'El estado activo/inactivo no es válido.',
};

function esEnteroNoNegativo(value) {
  return value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0;
}

export function PartFormModal({ repuesto, onClose }) {
  const isEdit = Boolean(repuesto);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nombre: repuesto?.nombre ?? '',
    codigoSku: repuesto?.codigoSku ?? '',
    stockActual: '',
    stockMinimo: repuesto?.stockMinimo ?? '',
    activo: repuesto?.activo ?? true,
  });
  const [validationError, setValidationError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? updatePart(repuesto.id, {
            nombre: form.nombre,
            codigoSku: form.codigoSku || null,
            stockMinimo: Number(form.stockMinimo),
            activo: form.activo,
          })
        : createPart({
            nombre: form.nombre,
            codigoSku: form.codigoSku || null,
            stockActual: Number(form.stockActual),
            stockMinimo: Number(form.stockMinimo),
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repuestos'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-alertas'] });
      onClose();
    },
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError('');

    if (!form.nombre) {
      setValidationError('El nombre es requerido.');
      return;
    }
    if (!isEdit && !esEnteroNoNegativo(form.stockActual)) {
      setValidationError('El stock inicial debe ser un número entero mayor o igual a cero.');
      return;
    }
    if (!esEnteroNoNegativo(form.stockMinimo)) {
      setValidationError('El stock mínimo debe ser un número entero mayor o igual a cero.');
      return;
    }

    mutation.mutate();
  }

  const serverError = mutation.isError
    ? SERVER_ERROR_MESSAGES[mutation.error.message] || 'No se pudo guardar el repuesto.'
    : '';

  return (
    <Modal>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-sm flex flex-col gap-3"
      >
        <h2 className="text-white text-base font-bold">{isEdit ? 'Editar repuesto' : 'Nuevo repuesto'}</h2>
        <Input id="nombre" label="Nombre" value={form.nombre} onChange={(e) => updateField('nombre', e.target.value)} />
        <Input
          id="codigoSku"
          label="Código (SKU)"
          value={form.codigoSku}
          onChange={(e) => updateField('codigoSku', e.target.value)}
        />
        {!isEdit && (
          <Input
            id="stockActual"
            label="Stock inicial"
            type="number"
            min="0"
            value={form.stockActual}
            onChange={(e) => updateField('stockActual', e.target.value)}
          />
        )}
        <Input
          id="stockMinimo"
          label="Stock mínimo"
          type="number"
          min="0"
          value={form.stockMinimo}
          onChange={(e) => updateField('stockMinimo', e.target.value)}
        />
        {isEdit && (
          <Checkbox
            id="activo"
            label="Activo"
            checked={form.activo}
            onChange={(e) => updateField('activo', e.target.checked)}
          />
        )}
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
