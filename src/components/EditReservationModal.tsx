import  { useEffect, useState } from 'react'
import type { Order } from '../types'

export default function EditReservationModal({
  reservation,
  onClose,
  onSave,
}: {
  reservation: Order | null
  onClose: () => void
  onSave: (o: Order) => void
}) {
  const [form, setForm] = useState<Order | null>(null)

  // Helper para mostrar fecha en formato 'DD - nombre de mes - YYYY'
  function formatDateDisplay(iso?: string) {
    if (!iso) return ''
    try {
      const d = new Date(iso + 'T00:00:00')
      const day = String(d.getDate()).padStart(2, '0')
      const month = d.toLocaleString('es-ES', { month: 'long' })
      const year = d.getFullYear()
      return `${day} - ${month} - ${year}`
    } catch {
      return iso
    }
  }

  // Parse formatted 'DD - month - YYYY' or ISO 'YYYY-MM-DD' into ISO 'YYYY-MM-DD'
  function parseToIso(s?: string) {
    if (!s) return ''
    // already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    // try to parse patterns like '16 - febrero - 2026' or '16 - febrero - 2026'
    const parts = s.split('-').map(p => p.trim())
    if (parts.length === 3) {
      const [dayStr, monthStr, yearStr] = parts
      const day = parseInt(dayStr, 10)
      const year = parseInt(yearStr, 10)
      if (!isNaN(day) && !isNaN(year)) {
        // map spanish month names to month index
        const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
        const monthIndex = months.findIndex(m => m.toLowerCase() === monthStr.toLowerCase())
        if (monthIndex >= 0) {
          const mm = String(monthIndex + 1).padStart(2,'0')
          const dd = String(day).padStart(2,'0')
          return `${year}-${mm}-${dd}`
        }
      }
    }
    // fallback: try Date parse
    const parsed = new Date(s)
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear()
      const m = String(parsed.getMonth()+1).padStart(2,'0')
      const d = String(parsed.getDate()).padStart(2,'0')
      return `${y}-${m}-${d}`
    }
    return ''
  }

  useEffect(() => {
    if (reservation) {
      // ensure form.date is ISO for the <input type="date"> control
      const iso = parseToIso(reservation.date)
      setForm({ ...reservation, date: iso })
    }
  }, [reservation])

  if (!form) return null

  function update<K extends keyof Order>(k: K, v: Order[K]) {
    setForm(prev => prev ? ({ ...prev, [k]: v }) : prev)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl md:max-w-3xl p-0 overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Editar Reserva</h3>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título de Reserva</label>
              <input className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" value={form.agency} onChange={(e) => update('agency', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Proveedor (quien hace el servicio)</label>
              <input className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" value={form.provider || ''} onChange={(e) => update('provider', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Servicio</label>
              <select className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" value={form.service} onChange={(e) => update('service', e.target.value)}>
                <option>Llegada</option>
                <option>Salida</option>
                <option>InterHotel</option>
                <option>Tour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Vuelo</label>
              <input className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" value={form.flight} onChange={(e) => update('flight', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input type="date" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" value={form.date} onChange={(e) => update('date', e.target.value)} />
              <div className="text-sm text-gray-500 mt-1">{formatDateDisplay(form.date)}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hora</label>
              <input type="time" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" value={form.time} onChange={(e) => update('time', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hotel</label>
              <input className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" value={form.hotel} onChange={(e) => update('hotel', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Pasajeros</label>
              <input type="number" min={0} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" value={String(form.passengers)} onChange={(e) => update('passengers', Number(e.target.value || 0))} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Habitación</label>
              <input className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" value={form.room} onChange={(e) => update('room', e.target.value)} />
            </div>

            {/* notas: ocupar full width */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Notas</label>
              <textarea className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 min-h-[96px]" value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button onClick={() => { if (form) { onSave({ ...form, date: formatDateDisplay(form.date) }); } }} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
