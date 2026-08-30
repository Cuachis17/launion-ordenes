import { useEffect, useRef, useState } from 'react'
import type { Receipt, ServiceKind, Currency } from '../types'
import { pendingAmount, ETIQUETAS_SERVICIO, requiereVuelo } from '../types'
import { formatMoney } from '../utils/receiptStorage'
import CampoFecha from './CampoFecha'
import CampoHora from './CampoHora'
import {
  validateReceiptFields,
  pickupPlaceholderFor,
  dropoffPlaceholderFor,
  type ReceiptErrors,
} from './ReceiptForm'

export default function EditReceiptModal({
  receipt,
  onClose,
  onSave,
}: {
  receipt: Receipt
  onClose: () => void
  onSave: (r: Receipt) => void
}) {
  const isDuplicate = !receipt.voucher

  const [voucher, setVoucher] = useState(receipt.voucher)
  const [passenger, setPassenger] = useState(receipt.passenger)
  const [service, setService] = useState<ServiceKind>(receipt.service)
  const [pax, setPax] = useState(receipt.pax)
  const [pickup, setPickup] = useState(receipt.pickup)
  const [dropoff, setDropoff] = useState(receipt.dropoff)
  const [date, setDate] = useState(receipt.date)
  const [time, setTime] = useState(receipt.time)
  const [flight, setFlight] = useState(receipt.flight || '')
  const [currency, setCurrency] = useState<Currency>(receipt.currency)
  const [total, setTotal] = useState(receipt.total)
  const [paid, setPaid] = useState(receipt.paid)
  const [errors, setErrors] = useState<ReceiptErrors>({})

  const voucherRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isDuplicate) voucherRef.current?.focus()
  }, [isDuplicate])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const pickupPlaceholder = pickupPlaceholderFor(service)
  const dropoffPlaceholder = dropoffPlaceholderFor(service)
  const pending = pendingAmount({ total: Number(total) || 0, paid: Number(paid) || 0 })

  function save() {
    const nextErrors = validateReceiptFields({ voucher, passenger, service, pickup, dropoff, date, time, flight, total, paid })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const next: Receipt = {
      ...receipt,
      voucher: voucher.trim().toUpperCase(),
      passenger: passenger.trim(),
      service,
      pax: Number(pax) || 1,
      pickup: pickup.trim(),
      dropoff: dropoff.trim(),
      date,
      time,
      ...(service === 'llegada' ? { flight: flight.trim() } : { flight: undefined }),
      currency,
      total: Number(total) || 0,
      paid: Number(paid) || 0,
    }
    onSave(next)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl md:max-w-3xl p-0 overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {isDuplicate ? 'Duplicar comprobante' : 'Editar comprobante'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-gray-900">
          {/* Identificación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de voucher</label>
              <input
                ref={voucherRef}
                value={voucher}
                onChange={(e) => setVoucher(e.target.value.toUpperCase())}
                className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm font-mono uppercase"
                placeholder="Ej: VCH-00123"
              />
              {errors.voucher && <p className="text-sm text-red-600 mt-1">{errors.voucher}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del pasajero</label>
              <input
                value={passenger}
                onChange={(e) => setPassenger(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
                placeholder="Ej: Juan Pérez"
              />
              {errors.passenger && <p className="text-sm text-red-600 mt-1">{errors.passenger}</p>}
            </div>
          </div>

          {/* Servicio */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de pax</label>
                <input
                  type="number"
                  min={1}
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">De dónde se recoge</label>
                <input
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
                  placeholder={pickupPlaceholder}
                />
                {errors.pickup && <p className="text-sm text-red-600 mt-1">{errors.pickup}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Para dónde va</label>
                <input
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
                  placeholder={dropoffPlaceholder}
                />
                {errors.dropoff && <p className="text-sm text-red-600 mt-1">{errors.dropoff}</p>}
              </div>
            </div>
          </div>

          {/* Fecha y hora */}
          <div className={`grid grid-cols-1 gap-3 ${requiereVuelo(service) ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <div className="mt-1">
                <CampoFecha valor={date} onCambiar={setDate} error={errors.date} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hora</label>
              <div className="mt-1">
                <CampoHora valor={time} onCambiar={setTime} error={errors.time} />
              </div>
            </div>
            {requiereVuelo(service) && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de vuelo</label>
                <input
                  value={flight}
                  onChange={(e) => setFlight(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
                  placeholder="Ej: AA1234"
                />
                {errors.flight && <p className="text-sm text-red-600 mt-1">{errors.flight}</p>}
              </div>
            )}
          </div>

          {/* Cobro */}
          <div className="rounded-xl bg-gray-50/70 border border-gray-200 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Moneda</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto total</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={total}
                  onChange={(e) => setTotal(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Depósito recibido</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paid}
                  onChange={(e) => setPaid(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm"
                />
                {errors.paid && <p className="text-sm text-red-600 mt-1">{errors.paid}</p>}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-gray-200 p-3 space-y-1">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>Total del servicio</span>
                <span className="font-medium">{formatMoney(Number(total) || 0, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-emerald-700">
                <span>Anticipo pagado</span>
                <span className="font-medium">{formatMoney(Number(paid) || 0, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-amber-800 pt-1 border-t border-gray-100">
                <span className="font-medium">Saldo a pagar al abordar</span>
                <span className="text-lg font-semibold">{formatMoney(pending, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button onClick={save} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
