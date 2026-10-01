// Tarjeta individual de comprobante con badges de servicio y acciones compactas.
import type { CompanyInfo, Receipt } from '../types'
import { etiquetaServicio, pendingAmount } from '../types'
import { formatMoney } from '../utils/receiptStorage'
import { downloadReceiptPdf, shareReceiptPdf } from '../utils/receiptPdf'
import {
  IconDownload,
  IconDuplicate,
  IconEdit,
  IconShare,
  IconTrash,
} from './ReceiptIcons'

type Props = {
  receipt: Receipt
  companyInfo: CompanyInfo
  user: unknown
  onDelete: (id: string) => void
  onEdit?: (receipt: Receipt) => void
  onDuplicate?: (receipt: Receipt) => void
}

function fechaCorta(iso: string) {
  const [year, month, day] = iso.split('-')
  return day && month && year ? `${day}/${month}/${year}` : iso
}

export default function ReceiptCard({
  receipt: r,
  companyInfo,
  user,
  onDelete,
  onEdit,
  onDuplicate,
}: Props) {
  const pending = pendingAmount(r)
  return (
    <div
      id={`comprobante-${r.id}`}
      data-id={r.id}
      className="bg-white rounded-xl border border-gray-200 shadow-lg p-4"
    >
      <div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-semibold text-gray-900">{r.voucher}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                r.service === 'llegada'
                  ? 'bg-indigo-100 text-indigo-700'
                  : r.service === 'hotel'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {etiquetaServicio(r)}
            </span>
          </div>
          <div className="text-sm font-medium text-gray-900 mt-1.5 truncate" title={r.passenger}>
            {r.passenger}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {fechaCorta(r.date)} · {r.time} hrs · {r.pax} pax
          </div>
          <div
            className="text-xs text-gray-500 mt-1 truncate"
            title={`${r.pickup} → ${r.dropoff}`}
          >
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
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(r)}
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-50
                rounded-md text-indigo-700 hover:bg-indigo-100 transition-colors"
              title="Editar"
              aria-label="Editar"
            >
              <IconEdit className="w-4 h-4" />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(r)}
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-50
                rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              title="Duplicar"
              aria-label="Duplicar"
            >
              <IconDuplicate className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadReceiptPdf(r, companyInfo, user)}
            className="shrink-0 w-10 h-10 flex items-center justify-center bg-green-50
              rounded-md text-green-700 hover:bg-green-100 transition-colors"
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
            className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-50
              rounded-md text-red-700 hover:bg-red-100 transition-colors"
            title="Eliminar"
            aria-label="Eliminar"
          >
            <IconTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
