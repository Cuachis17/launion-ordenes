// Formulario de alta: delega captura y validación compartidas antes de emitir el comprobante.
import type { FormEvent } from 'react'
import type { Receipt } from '../types'
import { useFormularioComprobante } from '../hooks/useFormularioComprobante'
import CamposComprobante from './CamposComprobante'

export default function ReceiptForm({ onSubmit }: {
  onSubmit: (receipt: Receipt) => boolean | void
}) {
  const formulario = useFormularioComprobante()
  function submit(event: FormEvent) {
    event.preventDefault()
    const receipt = formulario.preparar()
    if (!receipt) return
    const guardado = onSubmit({
      ...receipt, id: crypto.randomUUID(), generatedAt: new Date().toISOString(),
    })
    // Conservar la captura permite reintentar cuando el navegador rechaza el guardado.
    if (guardado !== false) formulario.reset()
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <CamposComprobante {...formulario} />
      <div className="flex gap-3">
        <button type="button" onClick={formulario.reset}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-foreground
            hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
          Limpiar
        </button>
        <button type="submit"
          className="min-h-11 flex-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground
            focus-visible:outline-2 focus-visible:outline-ring">
          Generar comprobante
        </button>
      </div>
    </form>
  )
}
