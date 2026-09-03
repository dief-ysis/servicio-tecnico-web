import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { UsersTable } from '../components/users/UsersTable';
import { UserFormModal } from '../components/users/UserFormModal';
import { TempPasswordModal } from '../components/users/TempPasswordModal';

const SERVER_ERROR_MESSAGES = {
  no_puede_modificarse_a_si_mismo: 'No puedes cambiar tu propio rol ni desactivar tu cuenta.',
  usuario_no_encontrado: 'Ese usuario ya no existe.',
  sin_permiso: 'No tienes permiso para gestionar usuarios.',
};

export function UsersPage() {
  const { usuario: usuarioActual } = useAuth();
  const queryClient = useQueryClient();

  const [modalUsuario, setModalUsuario] = useState(undefined); // undefined = cerrado, null = alta, objeto = edición
  const [creado, setCreado] = useState(null); // {usuario, contrasenaTemp} recién creado

  const { data, isLoading, isError } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsers,
  });

  const toggleMutation = useMutation({
    mutationFn: (usuario) => updateUser(usuario.id, { activo: !usuario.activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const errorToggle = toggleMutation.isError
    ? SERVER_ERROR_MESSAGES[toggleMutation.error.message] || 'No se pudo actualizar el usuario.'
    : '';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-lg font-bold">Usuarios</h1>
        <Button onClick={() => setModalUsuario(null)}>Nuevo usuario</Button>
      </div>

      {isError && <ErrorBanner message="No se pudo cargar la lista de usuarios." />}
      <ErrorBanner message={errorToggle} />

      {isLoading ? (
        <p className="text-ink-500 text-sm">Cargando...</p>
      ) : data ? (
        <UsersTable
          usuarios={data}
          usuarioActualId={usuarioActual?.id}
          onEdit={(u) => setModalUsuario(u)}
          onToggleActivo={(u) => toggleMutation.mutate(u)}
        />
      ) : null}

      {modalUsuario !== undefined && (
        <UserFormModal
          usuario={modalUsuario}
          onClose={() => setModalUsuario(undefined)}
          onCreado={(data) => setCreado(data)}
        />
      )}

      {creado && (
        <TempPasswordModal
          usuario={creado.usuario}
          contrasenaTemp={creado.contrasenaTemp}
          onClose={() => setCreado(null)}
        />
      )}
    </div>
  );
}
