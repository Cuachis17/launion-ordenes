// Cabecera adaptable: mantiene menú, perfil y ajustes del PDF accesibles también en móvil.
import unionLogo from '../assets/union.png'
import type { SessionUser } from '../hooks/useSession'

type UsuarioCabecera = Pick<SessionUser, '_id' | 'username' | 'avatar'> & {
  id?: string | number
}
type Props = {
  count: number
  onOpenEditor: () => void
  onLoginClick: () => void
  onProfileClick: () => void
  onOpenMenu: () => void
  subtitulo: string
  unidad: [string, string]
  user: UsuarioCabecera | null
  mostrarResumen?: boolean
}
const FOCO = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const ICONO_USUARIO = 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
const ICONO_LAPIZ = 'M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0'
  + 'l-1.83 1.83 3.75 3.75 1.83-1.83z'

export default function Header({
  count, onOpenEditor, onLoginClick, onProfileClick, onOpenMenu,
  subtitulo, unidad, user, mostrarResumen = true,
}: Props) {
  // Una base vacía es válida cuando la API comparte el origen del front.
  const apiUrl = import.meta.env.VITE_API_URL ?? ''
  // La versión estable del avatar evita descargas nuevas en cada render de la cabecera.
  const usuarioId = user?.id ?? user?._id
  const avatarUrl = user?.avatar && usuarioId
    ? `${apiUrl}/api/users/${usuarioId}/avatar?v=${encodeURIComponent(user.avatar)}`
    : null
  return (
    <header className="sticky top-0 z-50 flex flex-col items-center border-b border-border
      bg-card pt-[env(safe-area-inset-top)] shadow-md">
      <div className="container mx-auto w-full px-3 py-2.5 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button type="button" onClick={onOpenMenu} aria-label="Abrir menú de aplicaciones"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg
                border border-border text-muted-foreground transition-colors hover:bg-accent
                hover:text-foreground ${FOCO}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden
              rounded-lg border border-border bg-muted shadow-sm">
              <img src={unionLogo} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-tight
                text-foreground sm:text-xl">
                La Union
              </p>
              <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{subtitulo}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-row items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={user ? onProfileClick : onLoginClick}
              aria-label={user ? 'Abrir perfil' : 'Iniciar sesión'}
              className={`flex min-h-11 items-center gap-2 rounded-lg bg-secondary px-2 py-2
                text-sm font-medium text-secondary-foreground transition-colors
                hover:bg-accent sm:px-4 ${FOCO}`}>
              <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full
                border border-border bg-card/50 shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d={ICONO_USUARIO} />
                  </svg>
                )}
              </span>
              <span className="hidden sm:inline">{user ? user.username : 'Iniciar sesión'}</span>
            </button>
            {mostrarResumen && (
              <button type="button" onClick={onOpenEditor} aria-label="Editar información del PDF"
                className={`flex min-h-11 items-center gap-2 rounded-lg sm:gap-4 ${FOCO}`}>
                <span className="hidden text-right sm:block">
                  <span className="block text-xs font-medium text-foreground">Razón social</span>
                  <span className="block text-xs text-muted-foreground">
                    {count} {count === 1 ? unidad[0] : unidad[1]}
                  </span>
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg
                  transition-colors hover:bg-accent" aria-hidden="true">
                  <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
                    <path d={ICONO_LAPIZ} fill="currentColor" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
