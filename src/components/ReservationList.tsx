import type { Order, CompanyInfo } from '../types'
import { downloadOrderPdf, downloadOrderPdfFormat2 } from '../utils/pdf'

// Iconos SVG pequeños y serios
function IconDownload({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
// Nuevo icono para diferenciar el segundo formato (Eliminado)
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
function IconCalendar({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function IconClock({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  )
}
function IconUsers({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IconEdit({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
      <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  )
}

export default function ReservationList({
  reservations,
  onDelete,
  onEdit,
  companyInfo,
  user,
}: {
  reservations: Order[]
  onDelete: (id: string) => void
  onEdit?: (o: Order) => void
  companyInfo: CompanyInfo
  user: any
}) {
  const isRoot = !!user

  if (reservations.length === 0) return <p className="text-gray-500">No hay reservas</p>

  return (
    <div className="space-y-3">
      {reservations.map((o) => (
        <div key={o.id} className="border rounded-lg p-3 relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-gray-800">{o.agency || '—'}</div>
              <div className="text-sm text-gray-500">{o.service}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => isRoot ? downloadOrderPdfFormat2(o, companyInfo, user) : downloadOrderPdf(o, companyInfo, user)}
                className="p-2 bg-green-50 rounded-md text-green-700 hover:bg-green-100 transition-colors"
                title="Descargar PDF"
                aria-label="Descargar PDF"
              >
                <IconDownload className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit && onEdit(o)}
                className="p-2 bg-blue-50 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
                title="Editar"
                aria-label="Editar"
              >
                <IconEdit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
                    onDelete(o.id)
                  }
                }}
                className="p-2 bg-red-50 rounded-md text-red-700 hover:bg-red-100 transition-colors"
                title="Eliminar"
                aria-label="Eliminar"
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600 grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2"><IconCalendar className="text-gray-500" /> <span>{o.date}</span></div>
            <div className="flex items-center gap-2"><IconClock className="text-gray-500" /> <span>{o.time || '—'}</span></div>
            <div className="flex items-center gap-2"><IconUsers className="text-gray-500" /> <span>{o.passengers}</span></div>
          </div>

          <div className="mt-2 text-sm text-gray-500">Hotel: {o.hotel || '—'}</div>
        </div>
      ))}
    </div>
  )
}
