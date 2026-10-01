// Navegación de aplicaciones filtrada por el rol de la sesión.
import { useEffect } from 'react'
import unionLogo from '../assets/union.png'

import { APPS, type AppId } from './apps'
export default function AppDrawer({
  abierto, activa, onElegir, onCerrar, role,
}: {
  role?: string
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
    <div
        className="fixed inset-0 z-[60]">
      <button
        aria-label="Cerrar menú"
        onClick={onCerrar}
        className="absolute inset-0 w-full h-full bg-foreground/30 backdrop-blur-[2px]
cursor-default"
      />

      <aside
        role="navigation"
        aria-label="Aplicaciones"
        className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-card border-r border-border
                   shadow-xl flex flex-col animate-[deslizar_.18s_ease-out]"
      >
        <div
        className="px-5 py-5 border-b border-border flex items-center gap-3">
          <div
        className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border
shrink-0">
            <img src={unionLogo} alt=""
        className="w-full h-full object-contain" />
          </div>
          <div
        className="min-w-0">
            <p
        className="text-base font-semibold text-foreground leading-tight">La Union</p>
            <p
        className="text-xs text-muted-foreground">Aplicaciones</p>
          </div>
        </div>

        <nav
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {APPS.filter(app => app.id !== 'usuarios' || role === 'admin').map((app) => {
            const esActiva = app.id === activa
            return (
              <button
                key={app.id}
                onClick={() => { onElegir(app.id); onCerrar() }}
                aria-current={esActiva ? 'page' : undefined}
                className={`relative text-left rounded-lg px-3.5 py-2.5 flex items-start gap-3
                    transition-colors ${
                  esActiva
                    ? 'bg-muted text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {esActiva && (
                  <span
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-primary" />
                )}
                <span
        className={`mt-0.5 shrink-0 ${esActiva ? 'text-primary'
          : 'text-muted-foreground'}`}>
                  {app.icono}
                </span>
                <span
        className="min-w-0">
                  <span
        className={`block text-sm ${esActiva ? 'font-semibold' : 'font-medium'}`}>
                    {app.nombre}
                  </span>
                  <span
        className="block text-xs text-muted-foreground mt-0.5">{app.descripcion}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div
        className="px-5 py-4 border-t border-border">
          <p
        className="text-xs text-muted-foreground">K&amp;C Solutions</p>
        </div>
      </aside>
    </div>
  )
}
