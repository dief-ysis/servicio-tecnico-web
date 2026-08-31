import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipment } from '../api/equipment';
import { getUsers } from '../api/users';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { EquipmentsTable } from '../components/equipment/EquipmentsTable';
import { ESTADO_LABELS } from '../lib/equipmentStates';

export function EquipmentsPage() {
  const [buscarInput, setBuscarInput] = useState('');
  const [estado, setEstado] = useState('');
  const [tecnico, setTecnico] = useState('');
  const buscar = useDebouncedValue(buscarInput, 300);

  const { data: usuarios, isError: isErrorUsuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsers,
  });
  const tecnicos = (usuarios || []).filter((u) => u.rol === 'TECNICO' && u.activo);

  const { data: equipos, isLoading, isError } = useQuery({
    queryKey: ['equipos', { buscar, estado, tecnico }],
    queryFn: () => getEquipment({ buscar, estado, tecnico }),
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-white text-lg font-bold">Equipos</h1>

      <div className="flex gap-3">
        <Input
          id="buscar"
          placeholder="Buscar por ID, tipo, marca o cliente"
          value={buscarInput}
          onChange={(e) => setBuscarInput(e.target.value)}
          className="flex-1"
        />
        <Select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select id="tecnico" value={tecnico} onChange={(e) => setTecnico(e.target.value)}>
          <option value="">Todos los técnicos</option>
          {tecnicos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </Select>
      </div>

      {isError && <ErrorBanner message="No se pudo cargar la lista de equipos." />}
      {isErrorUsuarios && <ErrorBanner message="No se pudo cargar la lista de técnicos para el filtro." />}

      {isLoading ? (
        <p className="text-ink-500 text-sm">Cargando...</p>
      ) : equipos ? (
        <EquipmentsTable equipos={equipos} />
      ) : null}
    </div>
  );
}
