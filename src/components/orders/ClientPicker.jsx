import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../../api/clients';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ClientFormModal } from '../clients/ClientFormModal';

export function ClientPicker({ cliente, onChange, id = 'buscar-cliente-orden' }) {
  const [searchInput, setSearchInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const q = useDebouncedValue(searchInput, 300);

  const { data } = useQuery({
    queryKey: ['clientes-picker', q],
    queryFn: () => getClients({ q, limit: 8 }),
    enabled: q.length >= 2,
  });

  if (cliente) {
    return (
      <div className="flex items-center justify-between bg-ink-800 border border-ink-700 rounded-md px-3 py-2">
        <span className="text-sm text-white">
          {cliente.nombre || cliente.empresa} — {cliente.telefono}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-ink-500 hover:text-gold"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        id={id}
        label="Cliente"
        placeholder="Buscar por nombre, empresa o teléfono..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      {data && data.data.length > 0 && (
        <ul className="flex flex-col gap-1 border border-ink-700 rounded-md overflow-hidden">
          {data.data.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c)}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-ink-800"
              >
                {c.nombre || c.empresa} — {c.telefono}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="secondary" onClick={() => setShowCreate(true)}>
        + Crear cliente nuevo
      </Button>
      {showCreate && (
        <ClientFormModal
          cliente={null}
          onSaved={(nuevoCliente) => onChange(nuevoCliente)}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
