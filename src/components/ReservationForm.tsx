import React, { useState, useRef, useEffect } from 'react'
import type { Order } from '../types'

export default function ReservationForm({ onSubmit }: { onSubmit: (o: Order) => void }) {
  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)

  const calendarRef = useRef<HTMLDivElement | null>(null)
  const hourRef = useRef<HTMLDivElement | null>(null)
  const minuteRef = useRef<HTMLDivElement | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showHoursList, setShowHoursList] = useState(false)
  const [showMinutesList, setShowMinutesList] = useState(false)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false)
      }
      if (hourRef.current && !hourRef.current.contains(e.target as Node)) {
        setShowHoursList(false)
      }
      if (minuteRef.current && !minuteRef.current.contains(e.target as Node)) {
        setShowMinutesList(false)
      }
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  function generateHours() { return Array.from({ length: 24 }).map((_, i) => String(i).padStart(2, '0')) }
  function generateMinutes(step = 5) { const arr: string[] = []; for (let m = 0; m < 60; m += step) arr.push(String(m).padStart(2,'0')); return arr }

  // helpers para inputs de hora/minuto
  function safePad(v: string | number) { return String(v).padStart(2, '0') }

  function roundToNextQuarter(date = new Date()) {
    const minutes = date.getMinutes()
    const remainder = 15 - (minutes % 15)
    if (remainder === 15) {
      // already on a quarter
      date.setSeconds(0, 0)
      return date
    }
    date.setMinutes(minutes + remainder)
    date.setSeconds(0, 0)
    return date
  }

  function defaultTimeString() {
    const d = roundToNextQuarter()
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    return `${hh}:${mm}`
  }

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
      service,
      date: formatDateDisplay(date),
      time,
      hotel,
      passengers: Number(passengers) || 0,
      room,
      flight,
      notes,
      generatedAt: new Date().toLocaleString('es-ES', { dateStyle: 'long' })
    }
    onSubmit(order)

    // reset
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

  // Helper formatted preview for date/time: 'DD - nombre de mes - YYYY'
  function formatDateDisplay(iso: string) {
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
  const formattedDate = formatDateDisplay(date)

  return (
    <form onSubmit={submit} className="space-y-4 text-gray-900">
      <div>
        <label className="block text-sm font-medium text-gray-700">Título de Reserva</label>
        <input value={agency} onChange={(e) => setAgency(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm" placeholder="Ej: Reserva Receptiva" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Proveedor (quien hace el servicio)</label>
        <input value={provider} onChange={(e) => setProvider(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm" placeholder="Ej: Transportes XYZ" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Servicio</label>
        <select value={service} onChange={(e) => setService(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm">
          <option>Llegada</option>
          <option>Salida</option>
          <option>InterHotel</option>
          <option>Tour</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative" ref={calendarRef}>
          <label className="block text-sm font-medium text-gray-700">Fecha</label>
          <button type="button" onClick={() => { setShowCalendar((s) => !s) }} aria-describedby="date-help" className="mt-1 block w-full text-left rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
            {formattedDate}
          </button>
          <p id="date-help" className="text-sm text-gray-500 mt-1">Selecciona fecha (no se permiten fechas pasadas).</p>

          {showCalendar && (
            <div className="absolute z-20 mt-2 w-full rounded-lg bg-white border border-gray-200 shadow-lg p-3 text-gray-800">
              <SimpleCalendar
                selectedIso={date}
                minIso={todayIso}
                onSelect={(iso) => { setDate(iso); setShowCalendar(false) }}
              />
            </div>
          )}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700">Hora</label>
          <div className="mt-1 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative" ref={hourRef}>
              <label htmlFor="hour-input" className="block text-sm font-medium text-gray-700 sm:hidden">Hora</label>
              <input
                id="hour-input"
                value={time.split(':')[0]}
                onClick={(e) => { e.stopPropagation(); setShowHoursList(s => !s); setShowMinutesList(false); setShowCalendar(false) }}
                onChange={(e) => { const hh = safePad(e.target.value.replace(/[^0-9]/g, '').slice(0,2) || '0'); const mm = time.split(':')[1] || '00'; setTime(`${hh}:${mm}`) }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                aria-label="Hora (HH)" />

              {showHoursList && (
                <div className="absolute z-30 mt-1 w-full max-h-48 overflow-auto rounded bg-white border border-gray-200 shadow-lg">
                  {generateHours().map(h => (
                    <button key={h} type="button" onClick={(ev) => { ev.stopPropagation(); const mm = time.split(':')[1] || '00'; setTime(`${h}:${mm}`); setShowHoursList(false) }} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-800">{h}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full sm:w-28 relative" ref={minuteRef}>
              <label htmlFor="minute-input" className="block text-sm font-medium text-gray-700 sm:hidden">Minutos</label>
              <input
                id="minute-input"
                value={time.split(':')[1]}
                onClick={(e) => { e.stopPropagation(); setShowMinutesList(s => !s); setShowHoursList(false); setShowCalendar(false) }}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '').slice(0,2) || '0'
                  // normalize to nearest 5
                  const num = Math.min(59, Number(raw))
                  const rounded = String(Math.round(num / 5) * 5).padStart(2, '0')
                  const hh = time.split(':')[0] || '00'
                  setTime(`${hh}:${rounded}`)
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                aria-label="Minutos (MM)" />

              {showMinutesList && (
                <div className="absolute z-30 mt-1 right-0 w-32 max-h-48 overflow-auto rounded bg-white border border-gray-200 shadow-lg">
                  {generateMinutes(5).map(m => (
                    <button key={m} type="button" onClick={(ev) => { ev.stopPropagation(); const hh = time.split(':')[0] || '00'; setTime(`${hh}:${m}`); setShowMinutesList(false) }} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-800">{m}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p id="time-help" className="text-sm text-gray-500 mt-1">Haz click en la hora o minutos para seleccionar desde la lista.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Hotel</label>
        <input value={hotel} onChange={(e) => setHotel(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm" placeholder="Ej: Hotel Paradisus" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Pasajeros</label>
          <input type="number" min={0} value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Habitación</label>
          <input value={room} onChange={(e) => setRoom(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm" placeholder="Ej: 301" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Número de Vuelo</label>
        <input value={flight} onChange={(e) => setFlight(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm" placeholder="Ej: AA1234" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notas</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm" placeholder="Notas importantes..." />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Crear Reserva</button>
      </div>
    </form>
  )
}

// Simple calendar component (month view) - minimal and self-contained
function SimpleCalendar({ selectedIso, minIso, onSelect }: { selectedIso: string; minIso?: string; onSelect: (iso: string) => void }) {
  const [viewDate, setViewDate] = useState(() => new Date(selectedIso + 'T00:00:00'))

  function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }
  function daysInMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  }

  const start = startOfMonth(viewDate)
  const firstWeekday = start.getDay() // 0 = Sun
  const totalDays = daysInMonth(viewDate)

  const days: Array<{ day: number; iso: string; disabled: boolean }> = []
  for (let i = 0; i < firstWeekday; i++) days.push({ day: 0, iso: '', disabled: true })
  for (let d = 1; d <= totalDays; d++) {
    const iso = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const disabled = minIso ? iso < minIso : false
    days.push({ day: d, iso, disabled })
  }

  return (
    <div className="text-gray-800">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="px-2 text-gray-800">◀</button>
        <div className="font-medium text-gray-800">{viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</div>
        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="px-2 text-gray-800">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['D','L','M','M','J','V','S'].map((wd) => <div key={wd} className="font-semibold text-gray-700">{wd}</div>)}
        {days.map((c, idx) => (
          <div key={idx} className={`p-1 ${c.day ? 'inline-block' : ''}`}>
            {c.day ? (
              <button type="button" disabled={c.disabled} onClick={() => onSelect(c.iso)} className={`w-8 h-8 rounded-full ${c.disabled ? 'text-gray-800' : 'text-gray-800 hover:bg-gray-100'}`}>
                {c.day}
              </button>
            ) : <div className="w-8 h-8" />}
          </div>
        ))}
      </div>
    </div>
  )
}
