import { useState } from 'react'
import type { Receipt, ServiceKind } from '../types'
import { pendingAmount, ETIQUETAS_SERVICIO } from '../types'
import { formatMoney } from '../utils/receiptStorage'
import { downloadReceiptPdf, shareReceiptPdf } from '../utils/receiptPdf'

function IconDownload({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconTrash({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1-2-2h2a2 2 0 0 1-2 2v2" />
    </svg>
  )
}

function IconEdit({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconDuplicate({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconSearch({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconReceipt({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg width="48" height="48" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 2v20l2.5-1.5L9 22l2.5-1.5L14 22l2.5-1.5L19 22V2l-2.5 1.5L14 2l-2.5 1.5L9 2 6.5 3.5 4 2z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  )
}

// Normaliza para comparar sin distinguir mayúsculas ni acentos.
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

type FilterTab = 'todos' | ServiceKind

// La fecha se guarda como AAAA-MM-DD; en pantalla se lee dd/mm/aaaa.
function fechaCorta(iso: string): string {
  const [a, m, d] = String(iso).split('-')
  return d && m && a ? `${d}/${m}/${a}` : iso
}

function IconShare({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 3v13m0-13l-4 4m4-4l4 4M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" />
    </svg>
  )
}

export default function ReceiptList({
  receipts,
  onDelete,
  onEdit,
  onDuplicate,
  companyInfo,
  user,
}: {
  receipts: Receipt[]
  onDelete: (id: string) => void
  onEdit?: (r: Receipt) => void
  onDuplicate?: (r: Receipt) => void
  companyInfo: any
  user: any
}) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<FilterTab>('todos')

  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
        <IconReceipt className="w-12 h-12 mb-3" />
        <p className="font-medium text-gray-500">Aún no hay comprobantes</p>
        <p className="text-sm mt-1">Captura el primero en el formulario de la izquierda.</p>
      </div>
    )
  }

  const normalizedQuery = normalize(query.trim())
  const filtered = receipts.filter((r) => {
    if (tab !== 'todos' && r.service !== tab) return false
    if (!normalizedQuery) return true
    return normalize(r.voucher).includes(normalizedQuery) || normalize(r.passenger).includes(normalizedQuery)
  })

  const sorted = [...filtered].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'llegada', label: 'Llegadas' },
    { key: 'salida', label: 'Salidas' },
    { key: 'hotel', label: 'Hotel' },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por voucher o pasajero"
            className="block w-full rounded-lg border-gray-200 shadow-sm py-2 pr-3 !pl-10"
          />
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Ningún comprobante coincide con la búsqueda.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((r) => {
            const pending = pendingAmount(r)
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
                <div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-gray-900">{r.voucher}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.service === 'llegada' ? 'bg-indigo-100 text-indigo-700'
                            : r.service === 'hotel' ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ETIQUETAS_SERVICIO[r.service]}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1.5 truncate" title={r.passenger}>
                      {r.passenger}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {fechaCorta(r.date)} · {r.time} hrs · {r.pax} pax
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate" title={`${r.pickup} → ${r.dropoff}`}>
                      {r.pickup} <span className="text-gray-400">→</span> {r.dropoff}
                    </div>
                    <div className="mt-2.5">
                      {pending > 0 ? (
                        <span className="text-amber-800 font-semibold text-sm">
                          Saldo: {formatMoney(pending, r.currency)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium text-sm">Pagado completo</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => shareReceiptPdf(r, companyInfo, user)}
                      className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg
                                 bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700
                                 active:bg-indigo-800 transition-colors"
                      title="Enviar el comprobante al pasajero"
                    >
                      <IconShare className="w-4 h-4" />
                      Enviar
                    </button>
{onEdit && onDuplicate && (
                      <>
                    <button
                      type="button"
                      onClick={() => onEdit(r)}
                      className="shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-md text-indigo-700 hover:bg-indigo-100 transition-colors"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicate(r)}
                      className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Duplicar"
                      aria-label="Duplicar"
                    >
                      <IconDuplicate className="w-4 h-4" />
                    </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => downloadReceiptPdf(r, companyInfo, user)}
                      className="shrink-0 w-10 h-10 flex items-center justify-center bg-green-50 rounded-md text-green-700 hover:bg-green-100 transition-colors"
                      title="Descargar PDF"
                      aria-label="Descargar PDF"
                    >
                      <IconDownload className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('¿Eliminar este comprobante?')) {
                          onDelete(r.id)
                        }
                      }}
                      className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-50 rounded-md text-red-700 hover:bg-red-100 transition-colors"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
