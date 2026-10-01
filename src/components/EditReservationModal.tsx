// Modal de edición de reservas con CampoFecha y CampoHora compartidos.
import { useEffect, useState } from 'react'
import type { Order } from '../types'
import { formatDateDisplay, parseToIso } from '../utils/fechaOrden'
import CampoFecha from './CampoFecha'
import CampoHora from './CampoHora'
import SelectorServicio from './SelectorServicio'

type Props = {
  reservation: Order | null
  onClose: () => void
  onSave: (order: Order) => void
}

export default function EditReservationModal({ reservation, onClose, onSave }: Props) {
  if (!reservation) return null
  return <FormularioEdicion key={reservation.id} reservation={reservation}
    onClose={onClose} onSave={onSave} />
}

function FormularioEdicion({
  reservation, onClose, onSave,
}: {
  reservation: Order
  onClose: () => void
  onSave: (order: Order) => void
}) {
  const [form, setForm] = useState<Order>(() => ({
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
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    onSave({
      ...form, service: form.service.trim() || 'Otro',
      date: formatDateDisplay(form.date),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="editar-reserva-titulo"
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl md:max-w-3xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 id="editar-reserva-titulo" className="text-lg font-semibold text-gray-900">
            Editar Reserva
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar"
            className="rounded-md p-2 hover:bg-gray-100">
            <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="editar-agency" className="block text-sm font-medium text-gray-700">
                Título de Reserva
              </label>
              <input id="editar-agency" value={form.agency}
                onChange={(e) => update('agency', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900" />
            </div>

            <div>
              <label htmlFor="editar-provider" className="block text-sm font-medium text-gray-700">
                Proveedor (quien hace el servicio)
              </label>
              <input id="editar-provider" value={form.provider || ''}
                onChange={(e) => update('provider', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900" />
            </div>

            <SelectorServicio value={form.service} onChange={(val) => update('service', val)} />

            <div>
              <label htmlFor="editar-flight" className="block text-sm font-medium text-gray-700">
                Número de Vuelo
              </label>
              <input id="editar-flight" value={form.flight}
                onChange={(e) => update('flight', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900" />
            </div>

            <div className="min-w-0">
              <label htmlFor="editar-orden-fecha"
                className="block text-sm font-medium text-gray-700">
                Fecha
              </label>
              <CampoFecha id="editar-orden-fecha" valor={form.date}
                onCambiar={(val) => update('date', val)} />
              <div className="mt-1 text-sm text-gray-500">
                {formatDateDisplay(form.date)}
              </div>
            </div>

            <div className="min-w-0">
              <label htmlFor="editar-orden-hora"
                className="block text-sm font-medium text-gray-700">
                Hora
              </label>
              <CampoHora id="editar-orden-hora" valor={form.time}
                onCambiar={(val) => update('time', val)} />
            </div>

            <div>
              <label htmlFor="editar-hotel" className="block text-sm font-medium text-gray-700">
                Hotel
              </label>
              <input id="editar-hotel" value={form.hotel}
                onChange={(e) => update('hotel', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900" />
            </div>

            <div>
              <label htmlFor="editar-passengers"
                className="block text-sm font-medium text-gray-700">
                Pasajeros
              </label>
              <input id="editar-passengers" type="number" min={0}
                value={String(form.passengers)}
                onChange={(e) => update('passengers', Number(e.target.value || 0))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900" />
            </div>

            <div>
              <label htmlFor="editar-room" className="block text-sm font-medium text-gray-700">
                Habitación
              </label>
              <input id="editar-room" value={form.room}
                onChange={(e) => update('room', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="editar-notes" className="block text-sm font-medium text-gray-700">
                Notas
              </label>
              <textarea id="editar-notes" value={form.notes || ''}
                onChange={(e) => update('notes', e.target.value)}
                className="mt-1 min-h-[96px] w-full rounded-lg border border-gray-200
                  px-3 py-2 text-gray-900" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg
                text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="button" onClick={handleSave}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg
                hover:bg-indigo-700">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
