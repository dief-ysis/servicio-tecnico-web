import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEquipmentById, updateEquipmentState, assignTechnician, submitBudget } from '../api/equipment';
import { getUsers } from '../api/users';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { ESTADO_LABELS, ESTADO_BADGE_VARIANT, getNextEstados } from '../lib/equipmentStates';

const SERVER_ERROR_MESSAGES = {
  transicion_no_permitida: 'Esa transición de estado no está permitida.',
  presupuesto_pendiente: 'El equipo tiene un presupuesto bloqueante pendiente de aprobación.',
  motivo_requerido: 'Debes indicar un motivo.',
  tecnico_no_encontrado: 'El técnico seleccionado ya no existe.',
  usuario_no_es_tecnico: 'El usuario seleccionado no es un técnico.',
  monto_requerido: 'El monto es requerido.',
  monto_invalido: 'El monto debe ser un número mayor a cero.',
  descripcion_requerida: 'La descripción es requerida.',
  equipo_no_encontrado: 'El equipo ya no existe.',
};

function serverMessage(error, fallback) {
  return SERVER_ERROR_MESSAGES[error?.message] || fallback;
}

function formatFecha(fechaIso) {
  return fechaIso ? new Date(fechaIso).toLocaleDateString('es-CL') : '—';
}

export function EquipmentDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [nuevoEstado, setNuevoEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [presupuestoMonto, setPresupuestoMonto] = useState('');
  const [presupuestoDescripcion, setPresupuestoDescripcion] = useState('');
  const [validationError, setValidationError] = useState('');

  const { data: equipo, isLoading, isError } = useQuery({
    queryKey: ['equipos', id],
    queryFn: () => getEquipmentById(id),
  });

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsers,
  });
  const tecnicos = (usuarios || []).filter((u) => u.rol === 'TECNICO');

  function invalidateEquipo() {
    queryClient.invalidateQueries({ queryKey: ['equipos', id] });
    queryClient.invalidateQueries({ queryKey: ['equipos'] });
  }

  const estadoMutation = useMutation({
    mutationFn: () => updateEquipmentState(id, { estado: nuevoEstado, motivo: motivo || undefined }),
    onSuccess: () => {
      setNuevoEstado('');
      setMotivo('');
      invalidateEquipo();
    },
  });

  const tecnicoMutation = useMutation({
    mutationFn: (tecnicoId) => assignTechnician(id, { tecnicoId }),
    onSuccess: invalidateEquipo,
  });

  const presupuestoMutation = useMutation({
    mutationFn: () =>
      submitBudget(id, { monto: Number(presupuestoMonto), descripcion: presupuestoDescripcion }),
    onSuccess: () => {
      setPresupuestoMonto('');
      setPresupuestoDescripcion('');
      invalidateEquipo();
    },
  });

  function handleConfirmarEstado() {
    setValidationError('');
    const motivoRequerido = nuevoEstado === 'NO_REPARABLE' && equipo.estado !== 'ESPERANDO_APROBACION';
    if (motivoRequerido && !motivo.trim()) {
      setValidationError('Debes indicar un motivo para marcar el equipo como no reparable.');
      return;
    }
    estadoMutation.mutate();
  }

  function handleAsignarTecnico(e) {
    const value = e.target.value;
    tecnicoMutation.mutate(value === '' ? null : Number(value));
  }

  function handleEnviarPresupuesto(e) {
    e.preventDefault();
    setValidationError('');
    if (!presupuestoMonto || Number(presupuestoMonto) <= 0) {
      setValidationError('El monto debe ser mayor a cero.');
      return;
    }
    if (!presupuestoDescripcion.trim()) {
      setValidationError('La descripción es requerida.');
      return;
    }
    presupuestoMutation.mutate();
  }

  if (isLoading) return <p className="text-ink-500 text-sm">Cargando...</p>;
  if (isError || !equipo) return <ErrorBanner message="No se pudo cargar el equipo." />;

  const nextEstados = getNextEstados(equipo.estado);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-white text-lg font-bold">{equipo.idInterno}</h1>
        <Badge variant={ESTADO_BADGE_VARIANT[equipo.estado]}>
          {ESTADO_LABELS[equipo.estado] || equipo.estado}
        </Badge>
      </div>

      <div className="text-sm flex flex-col gap-1">
        <p className="text-white font-semibold">{equipo.tipoModelo}</p>
        {equipo.marca && <p className="text-ink-500">Marca: {equipo.marca}</p>}
        {equipo.numeroSerie && <p className="text-ink-500">N° de serie: {equipo.numeroSerie}</p>}
        <p className="text-white">Falla reportada: {equipo.fallaReportada}</p>
        {equipo.accesorios && <p className="text-ink-500">Accesorios: {equipo.accesorios}</p>}
      </div>

      <div className="text-sm">
        <p className="text-ink-500">Cliente</p>
        <p className="text-white">{equipo.cliente.nombre || equipo.cliente.empresa}</p>
        <p className="text-ink-500">{equipo.cliente.telefono}</p>
        <Link to={`/ordenes/${equipo.ordenId}`} className="text-xs text-gold hover:underline">
          Ver orden (ingreso {formatFecha(equipo.orden.fechaIngreso)})
        </Link>
      </div>

      <ErrorBanner message={validationError} />

      <div className="border border-ink-700 rounded-md p-3 flex flex-col gap-2">
        <p className="text-ink-500 text-xs uppercase font-semibold">Técnico asignado</p>
        <Select
          id="tecnico-asignado"
          label="Técnico"
          value={equipo.tecnicoAsignadoId ?? ''}
          onChange={handleAsignarTecnico}
          disabled={tecnicoMutation.isPending}
        >
          <option value="">Sin asignar</option>
          {tecnicos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </Select>
        <ErrorBanner
          message={tecnicoMutation.isError ? serverMessage(tecnicoMutation.error, 'No se pudo asignar el técnico.') : ''}
        />
      </div>

      <div className="border border-ink-700 rounded-md p-3 flex flex-col gap-2">
        <p className="text-ink-500 text-xs uppercase font-semibold">Cambiar estado</p>
        {nextEstados.length === 0 ? (
          <p className="text-ink-500 text-sm">Sin transiciones disponibles.</p>
        ) : (
          <>
            <Select id="nuevo-estado" label="Nuevo estado" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
              <option value="">Selecciona un estado</option>
              {nextEstados.map((value) => (
                <option key={value} value={value}>
                  {ESTADO_LABELS[value] || value}
                </option>
              ))}
            </Select>
            {nuevoEstado === 'NO_REPARABLE' && (
              <Textarea
                id="motivo"
                label="Motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            )}
            <Button
              type="button"
              onClick={handleConfirmarEstado}
              disabled={!nuevoEstado || estadoMutation.isPending}
            >
              {estadoMutation.isPending ? 'Guardando...' : 'Confirmar'}
            </Button>
            <ErrorBanner
              message={estadoMutation.isError ? serverMessage(estadoMutation.error, 'No se pudo cambiar el estado.') : ''}
            />
          </>
        )}
      </div>

      <div className="border border-ink-700 rounded-md p-3 flex flex-col gap-2">
        <p className="text-ink-500 text-xs uppercase font-semibold">Presupuesto</p>
        {equipo.presupuestoMonto != null ? (
          <div className="text-sm">
            <p className="text-white">Monto: ${equipo.presupuestoMonto}</p>
            <p className="text-ink-500">{equipo.presupuestoDescripcion}</p>
            <p className="text-ink-500">
              {equipo.presupuestoAprobado ? 'Aprobado' : 'Pendiente de aprobación'}
            </p>
          </div>
        ) : (
          <p className="text-ink-500 text-sm">Sin presupuesto registrado.</p>
        )}
        {equipo.estado === 'EN_DIAGNOSTICO' && (
          <form onSubmit={handleEnviarPresupuesto} className="flex flex-col gap-2">
            <Input
              id="presupuesto-monto"
              label="Monto"
              type="number"
              min="1"
              value={presupuestoMonto}
              onChange={(e) => setPresupuestoMonto(e.target.value)}
            />
            <Textarea
              id="presupuesto-descripcion"
              label="Descripción"
              value={presupuestoDescripcion}
              onChange={(e) => setPresupuestoDescripcion(e.target.value)}
            />
            <Button type="submit" variant="secondary" disabled={presupuestoMutation.isPending}>
              {presupuestoMutation.isPending ? 'Guardando...' : 'Enviar presupuesto'}
            </Button>
            <ErrorBanner
              message={
                presupuestoMutation.isError
                  ? serverMessage(presupuestoMutation.error, 'No se pudo registrar el presupuesto.')
                  : ''
              }
            />
          </form>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-ink-500 text-xs uppercase font-semibold">Historial</p>
        {equipo.historial.length === 0 ? (
          <p className="text-ink-500 text-sm">Sin movimientos.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {equipo.historial.map((h) => (
              <li key={h.id} className="border-t border-ink-700 pt-2">
                <p className="text-white">
                  {(ESTADO_LABELS[h.estadoAnterior] || h.estadoAnterior || 'Inicio')} → {ESTADO_LABELS[h.estadoNuevo] || h.estadoNuevo}
                </p>
                <p className="text-ink-500 text-xs">
                  {formatFecha(h.fecha)} · {h.usuarioNombre}
                </p>
                {h.motivo && <p className="text-ink-500 text-xs">Motivo: {h.motivo}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
