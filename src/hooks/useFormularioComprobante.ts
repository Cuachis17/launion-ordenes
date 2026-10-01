// Estado y validación comunes para crear, editar y duplicar comprobantes sin divergencias.
import { useState } from 'react'
import type { Receipt } from '../types'
import { requiereVuelo } from '../types'

export type ErroresComprobante = Partial<Record<keyof Receipt, string>>

function vacio(): Receipt {
  return {
    id: '', voucher: '', passenger: '', service: 'llegada', serviceOther: '', pax: 1,
    pickup: '', dropoff: '', date: '', time: '', flight: '', currency: 'MXN',
    total: 0, paid: 0, generatedAt: '',
  }
}

export function useFormularioComprobante(inicial?: Receipt) {
  const [form, setForm] = useState<Receipt>(() => inicial ?? vacio())
  const [errors, setErrors] = useState<ErroresComprobante>({})
  function update<K extends keyof Receipt>(key: K, value: Receipt[K]) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }
  function preparar(): Receipt | null {
    const next: ErroresComprobante = {}
    if (!form.passenger.trim()) next.passenger = 'El nombre del pasajero es obligatorio.'
    if (!form.pickup.trim()) next.pickup = 'El punto de recogida es obligatorio.'
    if (!form.dropoff.trim()) next.dropoff = 'El destino es obligatorio.'
    if (!form.date) next.date = 'La fecha es obligatoria.'
    if (!form.time) next.time = 'La hora es obligatoria.'
    if (requiereVuelo(form.service) && !form.flight?.trim()) {
      next.flight = 'El número de vuelo es obligatorio en llegadas.'
    }
    if (form.paid > form.total) next.paid = 'El pagado no puede superar al total.'
    setErrors(next)
    if (Object.keys(next).length) return null
    // Borra datos exclusivos al cambiar de servicio, también al editar un comprobante previo.
    return {
      ...form,
      voucher: form.voucher.trim().toUpperCase(),
      passenger: form.passenger.trim(),
      serviceOther: form.service === 'otro' ? form.serviceOther?.trim() : undefined,
      pickup: form.pickup.trim(),
      dropoff: form.dropoff.trim(),
      flight: requiereVuelo(form.service) ? form.flight?.trim() : undefined,
      pax: Number(form.pax) || 1,
      total: Number(form.total) || 0,
      paid: Number(form.paid) || 0,
    }
  }
  function reset() {
    setForm(vacio())
    setErrors({})
  }
  return { form, errors, update, preparar, reset }
}
