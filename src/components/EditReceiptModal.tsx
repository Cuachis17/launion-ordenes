// Edición y duplicado usan los mismos campos que el alta para conservar el servicio Otro.
import { useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import type { Receipt } from '../types'
import { useFormularioComprobante } from '../hooks/useFormularioComprobante'
import CamposComprobante from './CamposComprobante'

export default function EditReceiptModal({ receipt, onClose, onSave }: {
  receipt: Receipt
  onClose: () => void
  onSave: (receipt: Receipt) => void
}) {
  const formulario = useFormularioComprobante(receipt)
  const contenedor = useRef<HTMLFormElement>(null)
  const isDuplicate = !receipt.voucher
  useEffect(() => {
    if (isDuplicate) contenedor.current?.querySelector('input')?.focus()
    function cerrar(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', cerrar)
    return () => window.removeEventListener('keydown', cerrar)
  }, [isDuplicate, onClose])
  function save(event: FormEvent) {
    event.preventDefault()
    const next = formulario.preparar()
    if (next) onSave(next)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <button type="button" aria-label="Cerrar comprobante" onClick={onClose}
        className="absolute inset-0" />
      <form ref={contenedor} onSubmit={save} role="dialog" aria-modal="true"
        aria-labelledby="editar-comprobante-titulo"
        className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 id="editar-comprobante-titulo"
            className="text-lg font-semibold text-card-foreground">
            {isDuplicate ? 'Duplicar comprobante' : 'Editar comprobante'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar"
            className="min-h-11 min-w-11 rounded-lg text-muted-foreground hover:bg-accent
              focus-visible:outline-2 focus-visible:outline-ring">×</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <CamposComprobante {...formulario} />
        </div>
        <div className="border-t border-border p-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="w-full sm:w-auto min-h-11 rounded-lg border border-border px-4
                text-foreground focus-visible:outline-2 focus-visible:outline-ring
                hover:bg-accent">
              Cancelar
            </button>
            <button type="submit"
              className="w-full sm:w-auto min-h-11 rounded-lg bg-primary px-4
                text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring
                hover:bg-primary/90">
              Guardar
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
