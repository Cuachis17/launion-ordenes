import unionLogo from '../assets/union.png'

export default function Header({ count, onOpenEditor }: { count: number; onOpenEditor: () => void }) {
 
  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200 flex flex-col items-center">


      <div className="container mx-auto px-6 py-4 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10  rounded-lg flex items-center justify-center">
              <img src={unionLogo} alt="La Union" className="object-contain" />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">La Union</p>
              <p className="text-xs text-gray-500">Registro de Reservas</p>
            </div>
          </div>

          <div className="flex items-center gap-4 cursor-pointer"
          onClick={onOpenEditor}>
            <div className="text-right">
              <p className="text-sm text-gray-700 font-medium">Cambiar razón social</p>
              <p className="text-xs text-gray-500">{count} {count === 1 ? 'reserva' : 'reservas'} activas</p>
            </div>
            <button
            
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Editar información del PDF"
            >
              <svg className="w-5 h-5 text-gray-600" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
                <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
