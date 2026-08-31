import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getParts } from '../api/parts';
import { useAuth } from '../contexts/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { LowStockAlerts } from '../components/parts/LowStockAlerts';
import { PartsTable } from '../components/parts/PartsTable';
import { PartFormModal } from '../components/parts/PartFormModal';
import { StockAdjustModal } from '../components/parts/StockAdjustModal';

export function PartsPage() {
  const { usuario } = useAuth();
  const canWrite = usuario.rol !== 'TECNICO';

  const [searchInput, setSearchInput] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const buscar = useDebouncedValue(searchInput, 300);

  const [modalRepuesto, setModalRepuesto] = useState(undefined); // undefined = cerrado, null = alta, objeto = edición
  const [ajusteRepuesto, setAjusteRepuesto] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['repuestos', { buscar, incluirInactivos }],
    queryFn: () => getParts({ buscar, incluirInactivos }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-lg font-bold">Repuestos</h1>
        {canWrite && <Button onClick={() => setModalRepuesto(null)}>Nuevo repuesto</Button>}
      </div>

      <LowStockAlerts />

      <div className="flex items-center gap-3">
        <Input
          id="buscar-repuestos"
          placeholder="Buscar por nombre o código..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1"
        />
        <Checkbox
          id="incluir-inactivos"
          label="Incluir inactivos"
          checked={incluirInactivos}
          onChange={(e) => setIncluirInactivos(e.target.checked)}
        />
      </div>

      {isError && <ErrorBanner message="No se pudo cargar el catálogo de repuestos." />}

      {isLoading ? (
        <p className="text-ink-500 text-sm">Cargando...</p>
      ) : data ? (
        <PartsTable
          repuestos={data}
          canWrite={canWrite}
          onEdit={(r) => setModalRepuesto(r)}
          onAdjustStock={(r) => setAjusteRepuesto(r)}
        />
      ) : null}

      {modalRepuesto !== undefined && (
        <PartFormModal repuesto={modalRepuesto} onClose={() => setModalRepuesto(undefined)} />
      )}
      {ajusteRepuesto && (
        <StockAdjustModal repuesto={ajusteRepuesto} onClose={() => setAjusteRepuesto(null)} />
      )}
    </div>
  );
}
