import { useEffect, type ReactNode } from 'react'
import unionLogo from '../assets/union.png'

export type AppId = 'ordenes' | 'comprobantes' | 'cotizador'

// La lista está pensada para crecer: añadir una app es añadir un objeto aquí.
export const APPS: { id: AppId; nombre: string; descripcion: string; icono: ReactNode }[] = [
  {
    id: 'ordenes',
    nombre: 'Órdenes de servicio',
    descripcion: 'Reservas y vouchers de transportación',
    icono: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'comprobantes',
    nombre: 'Comprobantes de venta',
    descripcion: 'Recibos para el pasajero',
    icono: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6m-6-4h6m-8 9l1.5-1.5L10 19l1.5-1.5L13 19l1.5-1.5L16 19l1.5-1.5L19 19V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14z" />
      </svg>
    ),
  },
  {
    id: 'cotizador',
    nombre: 'Cotizador de traslados',
    descripcion: 'Tarifas de rutas, tours y extras',
    icono: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M6 16V8m6 8V5m6 11v-6M4 5h16" />
      </svg>
    ),
  },
]

export default function AppDrawer({
  abierto, activa, onElegir, onCerrar,
}: {
  abierto: boolean
  activa: AppId
  onElegir: (id: AppId) => void
  onCerrar: () => void
}) {
  // Escape cierra el panel, y con el panel abierto no se hace scroll detrás.
  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', alTeclear)
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflowPrevio
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        aria-label="Cerrar menú"
        onClick={onCerrar}
        className="absolute inset-0 w-full h-full bg-black/30 backdrop-blur-[2px] cursor-default"
      />

      <aside
        role="navigation"
        aria-label="Aplicaciones"
        className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white border-r border-gray-200
                   shadow-xl flex flex-col animate-[deslizar_.18s_ease-out]"
      >
        <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
            <img src={unionLogo} alt="" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-gray-900 leading-tight">La Union</p>
            <p className="text-xs text-gray-500">Aplicaciones</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {APPS.map((app) => {
            const esActiva = app.id === activa
            return (
              <button
                key={app.id}
                onClick={() => { onElegir(app.id); onCerrar() }}
                aria-current={esActiva ? 'page' : undefined}
                className={`relative text-left rounded-lg px-3.5 py-2.5 flex items-start gap-3 transition-colors ${
                  esActiva
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {esActiva && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-indigo-600" />
                )}
                <span className={`mt-0.5 shrink-0 ${esActiva ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {app.icono}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm ${esActiva ? 'font-semibold' : 'font-medium'}`}>
                    {app.nombre}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">{app.descripcion}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">K&amp;C Solutions</p>
        </div>
      </aside>
    </div>
  )
}
