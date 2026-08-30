import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../api/orders';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { OrdersTable } from '../components/orders/OrdersTable';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { ClientPicker } from '../components/orders/ClientPicker';

const PAGE_SIZE = 20;

export function OrdersPage() {
  const { usuario } = useAuth();
  const canWrite = usuario.rol === 'RECEPCION' || usuario.rol === 'ADMIN';

  const [clienteFiltro, setClienteFiltro] = useState(null);
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ordenes', { clienteId: clienteFiltro?.id, page }],
    queryFn: () =>
      getOrders({ clienteId: clienteFiltro?.id, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  function handleFiltroChange(cliente) {
    setClienteFiltro(cliente);
    setPage(0);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-lg font-bold">Órdenes</h1>
        {canWrite && <Button onClick={() => setModalOpen(true)}>Nueva orden</Button>}
      </div>

      <ClientPicker id="filtro-cliente-orden" cliente={clienteFiltro} onChange={handleFiltroChange} />

      {isError && <ErrorBanner message="No se pudo cargar la lista de órdenes." />}

      {isLoading ? (
        <p className="text-ink-500 text-sm">Cargando...</p>
      ) : data ? (
        <>
          <OrdersTable ordenes={data.data} />
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
      ) : null}

      {modalOpen && <OrderFormModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
