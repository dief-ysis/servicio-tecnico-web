import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser, updateUser } from '../../api/users';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';

const ROLES = ['RECEPCION', 'TECNICO', 'ADMIN'];

const SERVER_ERROR_MESSAGES = {
  identificador_en_uso: 'Ese identificador ya está en uso por otro usuario.',
  datos_requeridos: 'Nombre, identificador y rol son requeridos.',
  rol_invalido: 'El rol seleccionado no es válido.',
  no_puede_modificarse_a_si_mismo: 'No puedes cambiar tu propio rol ni desactivar tu cuenta.',
  usuario_no_encontrado: 'Ese usuario ya no existe.',
  sin_permiso: 'No tienes permiso para gestionar usuarios.',
};

export function UserFormModal({ usuario, onClose, onCreado }) {
  const isEdit = Boolean(usuario);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? '',
    identificador: usuario?.identificador_acceso ?? '',
    rol: usuario?.rol ?? 'TECNICO',
  });
  const [validationError, setValidationError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        // El identificador no se manda: el backend no lo acepta en el PATCH.
        ? updateUser(usuario.id, { nombre: form.nombre, rol: form.rol })
        : createUser({ nombre: form.nombre, identificador: form.identificador, rol: form.rol }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      // En alta, el padre necesita la contraseña temporal para mostrarla: es
      // la única vez que existe en claro.
      if (!isEdit) onCreado?.(data);
      onClose();
    },
  });

  function updateField(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError('');

    if (!form.nombre.trim()) {
      setValidationError('El nombre es requerido.');
      return;
    }
    if (!isEdit && !form.identificador.trim()) {
      setValidationError('El identificador es requerido.');
      return;
    }
    mutation.mutate();
  }

  const serverError = mutation.isError
    ? SERVER_ERROR_MESSAGES[mutation.error.message] || 'No se pudo guardar el usuario.'
    : '';

  return (
    <Modal>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-sm flex flex-col gap-3"
      >
        <h2 className="text-white text-base font-bold">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2>

        <Input
          id="nombre"
          label="Nombre"
          value={form.nombre}
          onChange={(e) => updateField('nombre', e.target.value)}
        />
        <Input
          id="identificador"
          label="Identificador"
          value={form.identificador}
          onChange={(e) => updateField('identificador', e.target.value)}
          disabled={isEdit}
        />
        {isEdit && (
          <p className="text-ink-500 text-xs -mt-2">El identificador no se puede cambiar.</p>
        )}
        <Select id="rol" label="Rol" value={form.rol} onChange={(e) => updateField('rol', e.target.value)}>
          {ROLES.map((rol) => (
            <option key={rol} value={rol}>{rol}</option>
          ))}
        </Select>

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
