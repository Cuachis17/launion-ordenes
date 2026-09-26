import unionLogo from '../assets/union.png'

export default function Header({ count, onOpenEditor, onLoginClick, onProfileClick, onOpenMenu, subtitulo, unidad, user, mostrarResumen = true }: { count: number; onOpenEditor: () => void; onLoginClick: () => void; onProfileClick: () => void; onOpenMenu: () => void; subtitulo: string; unidad: [string, string]; user: any; mostrarResumen?: boolean }) {
  const apiUrl = import.meta.env.VITE_API_URL
  const avatarUrl = user?.avatar
    ? `${apiUrl}/api/users/${user.id}/avatar?t=${Date.now()}`
    : null

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200 flex flex-col items-center pt-[env(safe-area-inset-top)]">


      <div className="container mx-auto px-3 sm:px-6 py-2.5 sm:py-4 w-full">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onOpenMenu}
              aria-label="Abrir menú de aplicaciones"
              className="h-11 w-11 rounded-lg border border-gray-200 flex items-center justify-center
                         text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
              <img src={unionLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-base sm:text-xl font-semibold text-gray-900 leading-tight truncate">La Union</p>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">{subtitulo}</p>
            </div>
          </div>

          <div className="flex flex-row items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={user ? onProfileClick : onLoginClick}
              className={`flex min-h-11 items-center gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${user ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                }`}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-white/50 flex items-center justify-center border border-gray-200 shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <span className="hidden sm:inline">{user ? user.username : 'Iniciar sesión'}</span>
            </button>


            {mostrarResumen && <button type="button" onClick={onOpenEditor} aria-label="Editar información del PDF"
              className="flex min-h-11 items-center gap-2 sm:gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-700 font-medium">Razón social</p>
                <p className="text-xs text-gray-500">{count} {count === 1 ? unidad[0] : unidad[1]}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center hover:bg-gray-100 rounded-lg transition-colors" aria-hidden="true">
                <svg className="w-5 h-5 text-gray-600" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
                  <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
                </svg>
              </span>
            </button>}


          </div>
        </div>
      </div>
    </header>
  )
}
