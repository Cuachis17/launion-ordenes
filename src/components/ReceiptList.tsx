// Historial filtrable de comprobantes; muestra nombres libres sin perder la clasificación Otro.
import { useState } from 'react'
import type { CompanyInfo, Receipt, ServiceKind } from '../types'
import { etiquetaServicio, pendingAmount } from '../types'
import { formatMoney } from '../utils/receiptStorage'
import { downloadReceiptPdf, shareReceiptPdf } from '../utils/receiptPdf'

type Props = {
  receipts: Receipt[]
  onDelete: (id: string) => void
  onEdit?: (receipt: Receipt) => void
  onDuplicate?: (receipt: Receipt) => void
  companyInfo: CompanyInfo
  user: unknown
  enfocarId?: string
  enfocarRevision?: number
}
type FilterTab = 'todos' | ServiceKind
const TABS: { key: FilterTab; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'llegada', label: 'Llegadas' },
  { key: 'salida', label: 'Salidas' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'otro', label: 'Otro' },
]
const ACCION = 'min-h-11 rounded-lg border border-border px-3 text-sm '
  + 'hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring'
function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
function fechaCorta(iso: string) {
  const [year, month, day] = iso.split('-')
  return day && month && year ? `${day}/${month}/${year}` : iso
}

export default function ReceiptList({
  receipts, onDelete, onEdit, onDuplicate, companyInfo, user, enfocarId,
  enfocarRevision = 0,
}: Props) {
  const [filtros, setFiltros] = useState<{
    objetivo?: string
    query: string
    tab: FilterTab
  }>({ objetivo: '-0', query: '', tab: 'todos' })
  const objetivo = `${enfocarId ?? ''}-${enfocarRevision}`
  // Ver debe revelar la tarjeta aunque el usuario estuviera buscando otro servicio o pasajero.
  const query = filtros.objetivo === objetivo ? filtros.query : ''
  const tab = filtros.objetivo === objetivo ? filtros.tab : 'todos'
  function setQuery(value: string) {
    setFiltros({ objetivo, query: value, tab })
  }
  function setTab(value: FilterTab) {
    setFiltros({ objetivo, query, tab: value })
  }
  if (!receipts.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="font-medium">Aún no hay comprobantes</p>
        <p className="mt-1 text-sm">Captura el primero en el formulario.</p>
      </div>
    )
  }
  const search = normalize(query.trim())
  const filtered = receipts.filter((receipt) => {
    if (tab !== 'todos' && receipt.service !== tab) return false
    return normalize(receipt.voucher).includes(search)
      || normalize(receipt.passenger).includes(search)
  }).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
  return (
    <div className="space-y-4 text-foreground">
      <label className="block text-sm">
        Buscar comprobantes
        <input value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por voucher o pasajero"
          className="mt-1 w-full rounded-lg border border-border bg-input-background px-3 py-2
            focus-visible:outline-2 focus-visible:outline-ring" />
      </label>
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted p-1">
        {TABS.map(({ key, label }) => (
          <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}
            className={`min-h-11 rounded-lg px-3 text-sm focus-visible:outline-2
              focus-visible:outline-ring ${tab === key
                ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
            {label}
          </button>
        ))}
      </div>
      {!filtered.length && (
        <p className="py-8 text-center text-muted-foreground">
          Ningún comprobante coincide con la búsqueda.
        </p>
      )}
      {filtered.map((receipt) => {
        const pending = pendingAmount(receipt)
        return (
          <article key={receipt.id} id={`comprobante-${receipt.id}`} data-id={receipt.id}
            tabIndex={-1}
            className="min-w-0 scroll-mt-24 rounded-xl border border-border bg-card p-4 shadow-lg
              focus-visible:outline-2 focus-visible:outline-ring">
            <div className="flex flex-wrap items-center gap-2">
              <span className="break-all font-mono font-semibold">{receipt.voucher}</span>
              <span className="max-w-full break-words rounded-full bg-secondary px-2 py-1
                text-xs font-medium text-secondary-foreground">
                {etiquetaServicio(receipt)}
              </span>
            </div>
            <p className="mt-1.5 truncate text-sm font-medium" title={receipt.passenger}>
              {receipt.passenger}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {fechaCorta(receipt.date)} · {receipt.time} hrs · {receipt.pax} pax
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground"
              title={`${receipt.pickup} → ${receipt.dropoff}`}>
              {receipt.pickup} → {receipt.dropoff}
            </p>
            <p className="mt-2.5 text-sm font-medium">
              {pending > 0 ? `Saldo: ${formatMoney(pending, receipt.currency)}` : 'Pagado completo'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
              <button type="button" onClick={() => shareReceiptPdf(receipt, companyInfo, user)}
                className="min-h-11 flex-1 rounded-lg bg-primary px-3 text-sm
                  text-primary-foreground
                  focus-visible:outline-2 focus-visible:outline-ring">Enviar</button>
              {onEdit && <button type="button" className={ACCION}
                onClick={() => onEdit(receipt)}>Editar</button>}
              {onDuplicate && <button type="button" className={ACCION}
                onClick={() => onDuplicate(receipt)}>Duplicar</button>}
              <button type="button" className={ACCION}
                onClick={() => downloadReceiptPdf(receipt, companyInfo, user)}>
                Descargar PDF
              </button>
              <button type="button" className={`${ACCION} text-destructive`}
                onClick={() => {
                  if (confirm('¿Eliminar este comprobante?')) onDelete(receipt.id)
                }}>Eliminar</button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
