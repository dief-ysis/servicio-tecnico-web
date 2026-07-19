import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../api/clients';
import { useAuth } from '../contexts/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { ClientsTable } from '../components/clients/ClientsTable';
import { ClientFormModal } from '../components/clients/ClientFormModal';

const PAGE_SIZE = 20;

export function ClientsPage() {
  const { usuario } = useAuth();
  const canWrite = usuario.rol !== 'TECNICO';

  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [modalCliente, setModalCliente] = useState(undefined); // undefined = cerrado, null = alta, objeto = edición

  const q = useDebouncedValue(searchInput, 300);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clientes', { q, page }],
    queryFn: () =>
      getClients({
        q: q.length >= 2 ? q : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  function handleSearchChange(value) {
    setSearchInput(value);
    setPage(0);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-lg font-bold">Clientes</h1>
        {canWrite && <Button onClick={() => setModalCliente(null)}>Nuevo cliente</Button>}
      </div>

      <Input
        id="buscar-clientes"
        placeholder="Buscar por nombre, empresa o teléfono..."
        value={searchInput}
        onChange={(e) => handleSearchChange(e.target.value)}
      />

      {isError && <ErrorBanner message="No se pudo cargar la lista de clientes." />}

      {isLoading ? (
        <p className="text-ink-500 text-sm">Cargando...</p>
      ) : (
        <>
          <ClientsTable clientes={data.data} canEdit={canWrite} onEdit={(cliente) => setModalCliente(cliente)} />
          <div className="flex items-center gap-3 text-sm text-ink-500">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="disabled:opacity-30 hover:text-gold"
            >
              Anterior
            </button>
            <span>
              Página {page + 1} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-30 hover:text-gold"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {modalCliente !== undefined && (
        <ClientFormModal cliente={modalCliente} onClose={() => setModalCliente(undefined)} />
      )}
    </div>
  );
}
