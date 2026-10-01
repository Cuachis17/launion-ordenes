// Edición de órdenes con selector compartido; conserva fechas históricas y servicios libres.
import { useEffect, useState } from 'react'
import type { Order } from '../types'
import { formatDateDisplay, parseToIso } from '../utils/fechaOrden'
import CampoFormulario from './CampoFormulario'
import SelectorServicio from './SelectorServicio'

type Props = {
  reservation: Order | null
  onClose: () => void
  onSave: (order: Order) => void
}

export default function EditReservationModal({ reservation, onClose, onSave }: Props) {
  // El contenido se monta por orden para evitar sincronizar props mediante efectos de estado.
  if (!reservation) return null
  return <FormularioOrden key={reservation.id} reservation={reservation}
    onClose={onClose} onSave={onSave} />
}

function FormularioOrden({ reservation, onClose, onSave }: Props & { reservation: Order }) {
  const [form, setForm] = useState(() => ({
    ...reservation, date: parseToIso(reservation.date),
  }))
  useEffect(() => {
    function cerrar(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', cerrar)
    return () => window.removeEventListener('keydown', cerrar)
  }, [onClose])
  function update<K extends keyof Order>(key: K, value: Order[K]) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <form role="dialog" aria-modal="true" aria-labelledby="editar-orden-titulo"
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-card shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault()
          onSave({ ...form, service: form.service.trim() || 'Otro',
            date: formatDateDisplay(form.date) })
        }}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 id="editar-orden-titulo" className="text-lg font-semibold text-card-foreground">
            Editar Reserva
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar"
            className="min-h-11 min-w-11 rounded-lg text-muted-foreground
              focus-visible:outline-2 focus-visible:outline-ring">×</button>
        </div>
        <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto p-4
          text-foreground sm:grid-cols-2">
          <CampoFormulario label="Título de Reserva" value={form.agency}
            onChange={(value) => update('agency', value)} />
          <CampoFormulario label="Proveedor (quien hace el servicio)" value={form.provider ?? ''}
            onChange={(value) => update('provider', value)} />
          <SelectorServicio value={form.service} onChange={(value) => update('service', value)} />
          <CampoFormulario label="Número de Vuelo" value={form.flight}
            onChange={(value) => update('flight', value)} />
          <CampoFormulario label="Fecha" type="date" value={form.date}
            onChange={(value) => update('date', value)} />
          <CampoFormulario label="Hora" type="time" value={form.time}
            onChange={(value) => update('time', value)} />
          <CampoFormulario label="Hotel" value={form.hotel}
            onChange={(value) => update('hotel', value)} />
          <CampoFormulario label="Pasajeros" type="number" min={0} value={form.passengers}
            onChange={(value) => update('passengers', Number(value))} />
          <CampoFormulario label="Habitación" value={form.room}
            onChange={(value) => update('room', value)} />
          <label className="min-w-0 text-sm font-medium sm:col-span-2">
            Notas
            <textarea value={form.notes ?? ''}
              onChange={(event) => update('notes', event.target.value)}
              className="mt-1 min-h-24 w-full rounded-lg border border-border bg-input-background
                px-3 py-2 focus-visible:outline-2 focus-visible:outline-ring" />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-border p-4">
          <button type="button" onClick={onClose}
            className="min-h-11 rounded-lg border border-border px-4 text-foreground
              focus-visible:outline-2 focus-visible:outline-ring">Cancelar</button>
          <button type="submit"
            className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground
              focus-visible:outline-2 focus-visible:outline-ring">Guardar</button>
        </div>
      </form>
    </div>
  )
}
