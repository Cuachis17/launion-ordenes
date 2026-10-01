// Historial de órdenes públicas: tarjetas localizables desde el aviso y descargas compartidas.
import type { Order, CompanyInfo } from '../types'
import { descargarPdfOrden } from '../utils/accionesPdf'

type Props = {
  reservations: Order[]
  onDelete: (id: string) => void
  onEdit?: (order: Order) => void
  companyInfo: CompanyInfo
  user: unknown
}
type Icono = 'descargar' | 'editar' | 'eliminar' | 'fecha' | 'hora' | 'pasajeros'
const BOTON = 'flex min-h-11 min-w-11 items-center justify-center rounded-md bg-secondary '
  + 'p-2 text-secondary-foreground transition-colors hover:bg-accent '
  + 'focus-visible:outline-2 focus-visible:outline-ring'
const LAPIZ = 'M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0'
  + 'l-1.83 1.83 3.75 3.75 1.83-1.83z'
function IconoOrden({ tipo }: { tipo: Icono }) {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tipo === 'descargar' && <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </>}
      {tipo === 'editar' && <>
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" /><path d={LAPIZ} />
      </>}
      {tipo === 'eliminar' && <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" />
        <path d="M9 6V4a2 2 0 0 1-2-2h2a2 2 0 0 1-2 2v2" />
      </>}
      {tipo === 'fecha' && <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>}
      {tipo === 'hora' && <>
        <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
      </>}
      {tipo === 'pasajeros' && <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>}
    </svg>
  )
}

export default function ReservationList({
  reservations, onDelete, onEdit, companyInfo, user,
}: Props) {
  if (!reservations.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
        <p className="font-medium">Aún no hay reservas</p>
        <p className="mt-1 text-sm">Crea la primera en el formulario.</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {reservations.map((order) => (
        <article key={order.id} id={`orden-${order.id}`} data-id={order.id} tabIndex={-1}
          className="relative min-w-0 scroll-mt-24 rounded-lg border border-border bg-card p-3
            text-card-foreground focus-visible:outline-2 focus-visible:outline-ring">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="break-words font-medium">{order.agency || '—'}</p>
              <p className="break-words text-sm text-muted-foreground">{order.service}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" className={BOTON} title="Descargar PDF"
                aria-label="Descargar PDF"
                onClick={() => descargarPdfOrden(order, companyInfo, user)}>
                <IconoOrden tipo="descargar" />
              </button>
              {onEdit && <button type="button" className={BOTON} title="Editar"
                aria-label="Editar" onClick={() => onEdit(order)}>
                <IconoOrden tipo="editar" />
              </button>}
              <button type="button" className={`${BOTON} text-destructive`} title="Eliminar"
                aria-label="Eliminar" onClick={() => {
                  if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
                    onDelete(order.id)
                  }
                }}><IconoOrden tipo="eliminar" /></button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="flex min-w-0 items-center gap-2">
              <IconoOrden tipo="fecha" /><span className="break-words">{order.date}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <IconoOrden tipo="hora" /><span>{order.time || '—'}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <IconoOrden tipo="pasajeros" /><span>{order.passengers}</span>
            </div>
          </div>
          <p className="mt-2 break-words text-sm text-muted-foreground">
            Hotel: {order.hotel || '—'}
          </p>
        </article>
      ))}
    </div>
  )
}
