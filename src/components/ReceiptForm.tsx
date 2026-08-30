import React, { useState } from 'react'
import type { Receipt, ServiceKind, Currency } from '../types'
import { pendingAmount, ETIQUETAS_SERVICIO, requiereVuelo } from '../types'
import { formatMoney } from '../utils/receiptStorage'
import CampoFecha from './CampoFecha'
import CampoHora from './CampoHora'

export type ReceiptErrors = Partial<Record<
  'voucher' | 'passenger' | 'pickup' | 'dropoff' | 'date' | 'time' | 'flight' | 'paid',
  string
>>

type Errors = ReceiptErrors

// Compartido con EditReceiptModal: misma validación para crear y editar/duplicar.
export function validateReceiptFields(fields: {
  voucher: string
  passenger: string
  service: ServiceKind
  pickup: string
  dropoff: string
  date: string
  time: string
  flight: string
  total: number
  paid: number
}): ReceiptErrors {
  const next: ReceiptErrors = {}
  if (!fields.passenger.trim()) next.passenger = 'El nombre del pasajero es obligatorio.'
  if (!fields.pickup.trim()) next.pickup = 'El punto de recogida es obligatorio.'
  if (!fields.dropoff.trim()) next.dropoff = 'El destino es obligatorio.'
  if (!fields.date) next.date = 'La fecha es obligatoria.'
  if (!fields.time) next.time = 'La hora es obligatoria.'
  if (requiereVuelo(fields.service) && !fields.flight.trim()) next.flight = 'El número de vuelo es obligatorio en llegadas.'
  if (Number(fields.paid) > Number(fields.total)) next.paid = 'El pagado no puede superar al total.'
  return next
}

export function pickupPlaceholderFor(service: ServiceKind) {
  if (service === 'llegada') return 'Ej: Aeropuerto de Cancún, Terminal 3'
  if (service === 'hotel') return 'Ej: Hotel Paradisus, lobby'
  return 'Ej: Hotel Paradisus, lobby'
}

export function dropoffPlaceholderFor(service: ServiceKind) {
  if (service === 'llegada') return 'Ej: Hotel Paradisus'
  if (service === 'hotel') return 'Ej: Hotel Xcaret México'
  return 'Ej: Aeropuerto de Cancún, Terminal 3'
}

export default function ReceiptForm({ onSubmit }: { onSubmit: (r: Receipt) => void }) {
  const [voucher, setVoucher] = useState('')
  const [passenger, setPassenger] = useState('')
  const [service, setService] = useState<ServiceKind>('llegada')
  const [pax, setPax] = useState(1)
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [flight, setFlight] = useState('')
  const [currency, setCurrency] = useState<Currency>('MXN')
  const [total, setTotal] = useState(0)
  const [paid, setPaid] = useState(0)
  const [errors, setErrors] = useState<Errors>({})

  const pickupPlaceholder = pickupPlaceholderFor(service)
  const dropoffPlaceholder = dropoffPlaceholderFor(service)

  function validate(): Errors {
    return validateReceiptFields({ voucher, passenger, service, pickup, dropoff, date, time, flight, total, paid })
  }

  function resetForm() {
    setVoucher('')
    setPassenger('')
    setService('llegada')
    setPax(1)
    setPickup('')
    setDropoff('')
    setDate('')
    setTime('')
    setFlight('')
    setCurrency('MXN')
    setTotal(0)
    setPaid(0)
    setErrors({})
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const receipt: Receipt = {
      id: crypto.randomUUID(),
      voucher: voucher.trim().toUpperCase(),
      passenger: passenger.trim(),
      service,
      pax: Number(pax) || 1,
      pickup: pickup.trim(),
      dropoff: dropoff.trim(),
      date,
      time,
      ...(service === 'llegada' ? { flight: flight.trim() } : {}),
      currency,
      total: Number(total) || 0,
      paid: Number(paid) || 0,
      generatedAt: new Date().toISOString(),
    }
    onSubmit(receipt)
    resetForm()
  }

  const pending = pendingAmount({ total: Number(total) || 0, paid: Number(paid) || 0 })

  return (
    <form onSubmit={submit} className="space-y-3 sm:space-y-6 text-gray-900">
      {/* Identificación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Número de voucher <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input
            value={voucher}
            onChange={(e) => setVoucher(e.target.value.toUpperCase())}
            className="mt-0.5 sm:mt-1 block w-full rounded-lg border-gray-200 shadow-sm font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder:text-gray-400"
            placeholder="Se genera solo"
          />
          {errors.voucher && <p className="text-sm text-red-600 mt-1">{errors.voucher}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del pasajero</label>
          <input
            value={passenger}
            onChange={(e) => setPassenger(e.target.value)}
            className="mt-0.5 sm:mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
            placeholder="Ej: Juan Pérez"
          />
          {errors.passenger && <p className="text-sm text-red-600 mt-1">{errors.passenger}</p>}
        </div>
      </div>

      {/* Servicio */}
      <div className="space-y-2 sm:space-y-3">
        <div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">Servicio</label>
            <div className="inline-flex w-full rounded-lg border border-gray-200 bg-gray-50 p-1">
              {(Object.keys(ETIQUETAS_SERVICIO) as ServiceKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setService(k)}
                  aria-pressed={service === k}
                  className={`flex-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    service === k ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {k === 'hotel' ? 'Hotel' : ETIQUETAS_SERVICIO[k]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 sm:mt-3 w-1/2 sm:w-1/3">
            <label className="block text-sm font-medium text-gray-700">Número de pax</label>
            <input
              type="number"
              min={1}
              value={pax}
              onChange={(e) => setPax(Number(e.target.value))}
              className="mt-0.5 sm:mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">De dónde se recoge</label>
            <input
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="mt-0.5 sm:mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
              placeholder={pickupPlaceholder}
            />
            {errors.pickup && <p className="text-sm text-red-600 mt-1">{errors.pickup}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Para dónde va</label>
            <input
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              className="mt-0.5 sm:mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
              placeholder={dropoffPlaceholder}
            />
            {errors.dropoff && <p className="text-sm text-red-600 mt-1">{errors.dropoff}</p>}
          </div>
        </div>
      </div>

      {/* Fecha y hora. En llegada el vuelo entra en la misma fila: puesto
          aparte gastaba 68px, que es lo que separaba al formulario de caber
          en una pantalla de teléfono. */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="min-w-0">
          <label htmlFor="campo-fecha" className="block text-sm font-medium text-gray-700">Fecha</label>
          <div className="mt-0.5 sm:mt-1">
            <CampoFecha id="campo-fecha" valor={date} onCambiar={setDate} error={errors.date} />
          </div>
        </div>
        <div className="min-w-0">
          <label htmlFor="campo-hora" className="block text-sm font-medium text-gray-700">Hora</label>
          <div className="mt-0.5 sm:mt-1">
            <CampoHora id="campo-hora" valor={time} onCambiar={setTime} error={errors.time} />
          </div>
        </div>
      </div>
      {requiereVuelo(service) && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700">Número de vuelo</label>
            <input
              value={flight}
              onChange={(e) => setFlight(e.target.value)}
              className="mt-0.5 sm:mt-1 block w-full min-w-0 rounded-lg border-gray-200 shadow-sm uppercase"
              placeholder="AA1234"
            />
            {errors.flight && <p className="text-sm text-red-600 mt-1">{errors.flight}</p>}
          </div>
        </div>
      )}

      {/* Cobro */}
      <div className="rounded-xl bg-gray-50/70 border border-gray-200 p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        {/* La moneda no necesita una columna: como interruptor en la cabecera
            deja el ancho completo a los montos, que antes se recortaban. */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-gray-700">Cobro</span>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
            {(['MXN', 'USD'] as Currency[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setCurrency(m)}
                aria-pressed={currency === m}
                className={`px-3 h-8 rounded-md text-xs font-semibold tracking-wide transition-colors ${
                  currency === m ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto total</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
              className="mt-0.5 sm:mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Anticipo recibido</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={paid}
              onChange={(e) => setPaid(Number(e.target.value))}
              className="mt-0.5 sm:mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
            />
            {errors.paid && <p className="text-sm text-red-600 mt-1">{errors.paid}</p>}
          </div>
        </div>

        <div className="rounded-lg bg-white border border-gray-200 p-2 sm:p-3 space-y-1">
          <div className="grid grid-cols-2 gap-2 sm:block sm:space-y-1">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Total</span>
              <span className="font-medium">{formatMoney(Number(total) || 0, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-emerald-700">
              <span>Anticipo</span>
              <span className="font-medium">{formatMoney(Number(paid) || 0, currency)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-amber-800 pt-1 border-t border-gray-100">
            <span className="font-medium">Saldo a pagar al abordar</span>
            <span className="text-lg font-semibold">{formatMoney(pending, currency)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center min-h-11 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Limpiar
        </button>
        <button
          type="submit"
          className="inline-flex flex-1 items-center justify-center min-h-11 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg"
        >
          Generar comprobante
        </button>
      </div>
    </form>
  )
}
