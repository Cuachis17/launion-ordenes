// Captura de órdenes sin sesión; reutiliza el selector compartido y preserva fechas locales.
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Order } from '../types'
import CampoFormulario from './CampoFormulario'
import CampoHora from './CampoHora'
import SelectorServicio from './SelectorServicio'

function horaInicial() {
  const now = new Date()
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15)
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
function fechaVisible(iso: string) {
  const fecha = new Date(`${iso}T00:00:00`)
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = fecha.toLocaleString('es-ES', { month: 'long' })
  return `${dia} - ${mes} - ${fecha.getFullYear()}`
}
function vacia(): Order {
  return {
    id: '', agency: '', provider: '', service: 'Llegada',
    date: new Date().toISOString().slice(0, 10), time: horaInicial(), hotel: '',
    passengers: 1, room: '', flight: '', notes: '', generatedAt: '',
  }
}

export default function ReservationForm({ onSubmit }: { onSubmit: (order: Order) => void }) {
  const [form, setForm] = useState(vacia)
  function update<K extends keyof Order>(key: K, value: Order[K]) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    onSubmit({
      ...form,
      id: Math.random().toString(36).slice(2, 10),
      service: form.service.trim() || 'Otro',
      date: fechaVisible(form.date),
      passengers: Number(form.passengers) || 0,
      generatedAt: new Date().toLocaleString('es-ES', { dateStyle: 'long' }),
    })
    // Conserva la selección de servicio, como el formulario previo, al emitir varias órdenes.
    setForm({ ...vacia(), service: form.service })
  }
  return (
    <form onSubmit={submit} className="space-y-4 text-foreground">
      <CampoFormulario label="Título de Reserva" value={form.agency}
        placeholder="Ej: Reserva Receptiva" onChange={(value) => update('agency', value)} />
      <CampoFormulario label="Proveedor (quien hace el servicio)" value={form.provider ?? ''}
        placeholder="Ej: Transportes XYZ" onChange={(value) => update('provider', value)} />
      <SelectorServicio value={form.service} onChange={(value) => update('service', value)} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CampoFormulario label="Fecha" type="date" value={form.date} required
          min={new Date().toISOString().slice(0, 10)}
          onChange={(value) => update('date', value)} />
        <div className="min-w-0">
          <label htmlFor="orden-hora" className="text-sm font-medium">Hora</label>
          <CampoHora id="orden-hora" valor={form.time}
            onCambiar={(value) => update('time', value)} />
        </div>
      </div>
      <CampoFormulario label="Hotel" value={form.hotel} placeholder="Ej: Hotel Paradisus"
        onChange={(value) => update('hotel', value)} />
      <div className="grid grid-cols-2 gap-3">
        <CampoFormulario label="Pasajeros" type="number" min={0} value={form.passengers}
          onChange={(value) => update('passengers', Number(value))} />
        <CampoFormulario label="Habitación" value={form.room} placeholder="Ej: 301"
          onChange={(value) => update('room', value)} />
      </div>
      <CampoFormulario label="Número de Vuelo" value={form.flight} placeholder="Ej: AA1234"
        onChange={(value) => update('flight', value)} />
      <label className="block text-sm font-medium">
        Notas
        <textarea value={form.notes ?? ''} placeholder="Notas importantes..."
          onChange={(event) => update('notes', event.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-input-background px-3 py-2
            focus-visible:outline-2 focus-visible:outline-ring" />
      </label>
      <div className="flex justify-end">
        <button type="submit"
          className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground
            focus-visible:outline-2 focus-visible:outline-ring">Crear Reserva</button>
      </div>
    </form>
  )
}
