// Historial filtrable de comprobantes con acciones compactas y estado visual restaurado.
import { useState } from 'react'
import type { CompanyInfo, Receipt, ServiceKind } from '../types'
import { IconReceipt, IconSearch } from './ReceiptIcons'
import ReceiptCard from './ReceiptCard'

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

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export default function ReceiptList({
  receipts,
  onDelete,
  onEdit,
  onDuplicate,
  companyInfo,
  user,
  enfocarId,
  enfocarRevision = 0,
}: Props) {
  const [filtros, setFiltros] = useState<{
    objetivo?: string
    query: string
    tab: FilterTab
  }>({ objetivo: '-0', query: '', tab: 'todos' })

  const objetivo = `${enfocarId ?? ''}-${enfocarRevision}`
  const query = filtros.objetivo === objetivo ? filtros.query : ''
  const tab = filtros.objetivo === objetivo ? filtros.tab : 'todos'

  function setQuery(value: string) {
    setFiltros({ objetivo, query: value, tab })
  }

  function setTab(value: FilterTab) {
    setFiltros({ objetivo, query, tab: value })
  }

  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
        <IconReceipt className="w-12 h-12 mb-3" />
        <p className="font-medium text-gray-500">Aún no hay comprobantes</p>
        <p className="text-sm mt-1">Captura el primero en el formulario de la izquierda.</p>
      </div>
    )
  }

  const search = normalize(query.trim())
  const filtered = receipts.filter((receipt) => {
    if (tab !== 'todos' && receipt.service !== tab) return false
    if (!search) return true
    return normalize(receipt.voucher).includes(search)
      || normalize(receipt.passenger).includes(search)
  }).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2
            text-gray-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por voucher o pasajero"
            className="block w-full rounded-lg border-gray-200 shadow-sm py-2 pr-3 !pl-10"
          />
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">
          Ningún comprobante coincide con la búsqueda.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ReceiptCard
              key={r.id}
              receipt={r}
              companyInfo={companyInfo}
              user={user}
              onDelete={onDelete}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
