// Formulario de creación de reservas con CampoFecha y CampoHora compartidos.
import React, { useState } from 'react'
import type { Order } from '../types'
import { fechaISO, formatDateDisplay, defaultTimeString } from '../utils/fechaOrden'
import CampoFecha from './CampoFecha'
import CampoHora from './CampoHora'
import SelectorServicio from './SelectorServicio'

export default function ReservationForm({ onSubmit }: { onSubmit: (o: Order) => void }) {
  const todayIso = fechaISO(new Date())

  const [agency, setAgency] = useState('')
  const [provider, setProvider] = useState('')
  const [service, setService] = useState('Llegada')
  const [date, setDate] = useState(() => todayIso)
  const [time, setTime] = useState(() => defaultTimeString())
  const [hotel, setHotel] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [room, setRoom] = useState('')
  const [flight, setFlight] = useState('')
  const [notes, setNotes] = useState('')

  function generateId() {
    return Math.random().toString(36).slice(2, 10)
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault()
    const order: Order = {
      id: generateId(),
      agency,
      provider,
      service: service.trim() || 'Otro',
      date: formatDateDisplay(date),
      time,
      hotel,
      passengers: Number(passengers) || 0,
      room,
      flight,
      notes,
      generatedAt: new Date().toLocaleString('es-ES', { dateStyle: 'long' }),
    }
    onSubmit(order)

    // Resetear manteniendo defaults
    setAgency('')
    setProvider('')
    setHotel('')
    setRoom('')
    setFlight('')
    setPassengers(1)
    setNotes('')
    setTime(defaultTimeString())
    setDate(todayIso)
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-gray-900">
      <div>
        <label htmlFor="orden-agency" className="block text-sm font-medium text-gray-700">
          Título de Reserva
        </label>
        <input
          id="orden-agency"
          value={agency}
          onChange={(e) => setAgency(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
          placeholder="Ej: Reserva Receptiva"
        />
      </div>

      <div>
        <label htmlFor="orden-provider" className="block text-sm font-medium text-gray-700">
          Proveedor (quien hace el servicio)
        </label>
        <input
          id="orden-provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
          placeholder="Ej: Transportes XYZ"
        />
      </div>

      <SelectorServicio value={service} onChange={setService} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label htmlFor="orden-fecha" className="block text-sm font-medium text-gray-700">
            Fecha
          </label>
          <CampoFecha
            id="orden-fecha"
            valor={date}
            onCambiar={setDate}
            minimo={todayIso}
          />
          <p id="date-help" className="mt-1 text-sm text-gray-500">
            Selecciona fecha (no se permiten fechas pasadas).
          </p>
        </div>
        <div className="min-w-0">
          <label htmlFor="orden-hora" className="block text-sm font-medium text-gray-700">
            Hora
          </label>
          <CampoHora
            id="orden-hora"
            valor={time}
            onCambiar={setTime}
          />
        </div>
      </div>

      <div>
        <label htmlFor="orden-hotel" className="block text-sm font-medium text-gray-700">
          Hotel
        </label>
        <input
          id="orden-hotel"
          value={hotel}
          onChange={(e) => setHotel(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
          placeholder="Ej: Hotel Paradisus"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="orden-passengers" className="block text-sm font-medium text-gray-700">
            Pasajeros
          </label>
          <input
            id="orden-passengers"
            type="number"
            min={0}
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="orden-room" className="block text-sm font-medium text-gray-700">
            Habitación
          </label>
          <input
            id="orden-room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
            placeholder="Ej: 301"
          />
        </div>
      </div>

      <div>
        <label htmlFor="orden-flight" className="block text-sm font-medium text-gray-700">
          Número de Vuelo
        </label>
        <input
          id="orden-flight"
          value={flight}
          onChange={(e) => setFlight(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
          placeholder="Ej: AA1234"
        />
      </div>

      <div>
        <label htmlFor="orden-notes" className="block text-sm font-medium text-gray-700">
          Notas
        </label>
        <textarea
          id="orden-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
          placeholder="Notas importantes..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg
            hover:bg-indigo-700"
        >
          Crear Reserva
        </button>
      </div>
    </form>
  )
}
