// Campos reutilizados al crear y editar; Otro no exige vuelo y muestra su nombre personalizado.
import { useId } from 'react'
import type { Receipt, ServiceKind, Currency } from '../types'
import { etiquetaServicio, pendingAmount, requiereVuelo } from '../types'
import type { ErroresComprobante } from '../hooks/useFormularioComprobante'
import { formatMoney } from '../utils/receiptStorage'
import CampoFormulario from './CampoFormulario'
import CampoFecha from './CampoFecha'
import CampoHora from './CampoHora'

type Props = {
  form: Receipt
  errors: ErroresComprobante
  update: <K extends keyof Receipt>(key: K, value: Receipt[K]) => void
}
const SERVICIOS: ServiceKind[] = ['llegada', 'salida', 'hotel', 'otro']

export default function CamposComprobante({ form, errors, update }: Props) {
  const fechaId = useId()
  const horaId = useId()
  const llegada = requiereVuelo(form.service)
  const placeholderRecogida = llegada
    ? 'Ej: Aeropuerto de Cancún, Terminal 3' : 'Ej: Hotel Paradisus, lobby'
  const placeholderDestino = form.service === 'salida'
    ? 'Ej: Aeropuerto de Cancún, Terminal 3' : 'Ej: Hotel Xcaret México'
  return (
    <div className="space-y-3 text-foreground">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CampoFormulario label="Número de voucher (opcional)" value={form.voucher}
          placeholder="Se genera solo" error={errors.voucher}
          onChange={(value) => update('voucher', value.toUpperCase())} />
        <CampoFormulario label="Nombre del pasajero" value={form.passenger}
          placeholder="Ej: Juan Pérez" error={errors.passenger}
          onChange={(value) => update('passenger', value)} />
      </div>
      <fieldset className="min-w-0">
        <legend className="text-sm font-medium">Servicio</legend>
        <div className="mt-1 grid grid-cols-4 gap-1 rounded-lg border border-border bg-muted p-1">
          {SERVICIOS.map((service) => (
            <button key={service} type="button" aria-pressed={form.service === service}
              onClick={() => update('service', service)}
              className={`min-w-0 min-h-11 rounded-md px-1 text-sm font-medium
                focus-visible:outline-2 focus-visible:outline-ring ${form.service === service
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'}`}>
              {service === 'hotel' ? 'Hotel' : etiquetaServicio({ service })}
            </button>
          ))}
        </div>
      </fieldset>
      {form.service === 'otro' && (
        <CampoFormulario label="¿Qué servicio?" value={form.serviceOther ?? ''}
          placeholder="Ej: Boda en Xcaret" onChange={(value) => update('serviceOther', value)} />
      )}
      <div className="grid grid-cols-2 gap-3">
        <CampoFormulario label="Número de pax" type="number" min={1} value={form.pax}
          onChange={(value) => update('pax', Number(value))} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CampoFormulario label="De dónde se recoge" value={form.pickup} error={errors.pickup}
          placeholder={placeholderRecogida} onChange={(value) => update('pickup', value)} />
        <CampoFormulario label="Para dónde va" value={form.dropoff} error={errors.dropoff}
          placeholder={placeholderDestino} onChange={(value) => update('dropoff', value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label htmlFor={fechaId} className="text-sm font-medium">Fecha</label>
          <CampoFecha id={fechaId} valor={form.date} error={errors.date}
            onCambiar={(value) => update('date', value)} />
        </div>
        <div className="min-w-0">
          <label htmlFor={horaId} className="text-sm font-medium">Hora</label>
          <CampoHora id={horaId} valor={form.time} error={errors.time}
            onCambiar={(value) => update('time', value)} />
        </div>
      </div>
      {llegada && (
        <CampoFormulario label="Número de vuelo" value={form.flight ?? ''}
          placeholder="AA1234" error={errors.flight}
          onChange={(value) => update('flight', value)} />
      )}
      <section className="space-y-3 rounded-xl border border-border bg-muted p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Cobro</span>
          <div className="flex gap-1">
            {(['MXN', 'USD'] as Currency[]).map((currency) => (
              <button key={currency} type="button" aria-pressed={form.currency === currency}
                onClick={() => update('currency', currency)}
                className={`min-h-11 rounded-lg px-3 text-sm focus-visible:outline-2
                  focus-visible:outline-ring ${form.currency === currency
                    ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'}`}>
                {currency}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CampoFormulario label="Monto total" type="number" step="0.01" min={0}
            value={form.total} onChange={(value) => update('total', Number(value))} />
          <CampoFormulario label="Anticipo recibido" type="number" step="0.01" min={0}
            value={form.paid} error={errors.paid}
            onChange={(value) => update('paid', Number(value))} />
        </div>
        <div className="space-y-1 rounded-lg border border-border bg-card p-3">
          <p className="flex justify-between gap-2 text-sm">
            <span>Total</span><span>{formatMoney(form.total, form.currency)}</span>
          </p>
          <p className="flex justify-between gap-2 text-sm">
            <span>Anticipo</span><span>{formatMoney(form.paid, form.currency)}</span>
          </p>
          <p className="flex flex-wrap justify-between gap-2 border-t border-border
            pt-1 font-medium">
            <span>Saldo a pagar al abordar</span>
            <span>{formatMoney(pendingAmount(form), form.currency)}</span>
          </p>
        </div>
      </section>
    </div>
  )
}
