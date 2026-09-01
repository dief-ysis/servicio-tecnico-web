import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrder, getReceiptBlob } from '../api/orders';
import { downloadReceipt } from '../lib/receipt';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { ErrorBanner } from '../components/ui/ErrorBanner';

function formatFecha(fechaIso) {
  return new Date(fechaIso).toLocaleDateString('es-CL');
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const canViewReceipt = usuario.rol === 'RECEPCION' || usuario.rol === 'ADMIN';
  const canViewEquipment = usuario.rol === 'TECNICO' || usuario.rol === 'ADMIN';
  const [receiptError, setReceiptError] = useState('');

  const { data: orden, isLoading, isError } = useQuery({
    queryKey: ['ordenes', id],
    queryFn: () => getOrder(id),
  });

  async function handleVerComprobante() {
    setReceiptError('');
    try {
      const blob = await getReceiptBlob(id);
      downloadReceipt(blob, `comprobante-${id}.pdf`);
    } catch {
      setReceiptError('No se pudo descargar el comprobante.');
    }
  }

  if (isLoading) return <p className="text-ink-500 text-sm">Cargando...</p>;
  if (isError || !orden) return <ErrorBanner message="No se pudo cargar la orden." />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-lg font-bold">Orden #{orden.id}</h1>
        {canViewReceipt && <Button onClick={handleVerComprobante}>Ver comprobante</Button>}
      </div>

      <ErrorBanner message={receiptError} />

      <div className="text-sm">
        <p className="text-ink-500">Fecha de ingreso</p>
        <p className="text-white">{formatFecha(orden.fechaIngreso)}</p>
      </div>

      <div className="text-sm">
        <p className="text-ink-500">Cliente</p>
        <p className="text-white">{orden.cliente.nombre || orden.cliente.empresa}</p>
        <p className="text-ink-500">{orden.cliente.telefono}</p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-ink-500 text-xs uppercase font-semibold">Equipos</p>
        {orden.equipos.map((equipo) => {
          const cardClassName = `border border-ink-700 rounded-md p-3 flex flex-col gap-1${
            canViewEquipment ? ' hover:border-gold' : ''
          }`;
          const contenido = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">{equipo.tipoModelo}</span>
                <span className="text-ink-500 text-xs">{equipo.idInterno}</span>
              </div>
              {equipo.marca && <p className="text-ink-500 text-sm">Marca: {equipo.marca}</p>}
              {equipo.numeroSerie && <p className="text-ink-500 text-sm">N° de serie: {equipo.numeroSerie}</p>}
              <p className="text-white text-sm">Falla reportada: {equipo.fallaReportada}</p>
              {equipo.accesorios && <p className="text-ink-500 text-sm">Accesorios: {equipo.accesorios}</p>}
              <p className="text-ink-500 text-xs uppercase">{equipo.estado}</p>
            </>
          );
          return canViewEquipment ? (
            <Link key={equipo.id} to={`/equipos/${equipo.id}`} className={cardClassName}>
              {contenido}
            </Link>
          ) : (
            <div key={equipo.id} className={cardClassName}>
              {contenido}
            </div>
          );
        })}
      </div>
    </div>
  );
}
