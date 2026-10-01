// Aviso de instalación PWA separado de la navegación.
import { useEffect, useState } from 'react'
interface InstallPrompt extends Event {
 prompt: () => Promise<void>
 userChoice: Promise<{ outcome: string }>
}
export default function PwaInstall() {
  // PWA install prompt state
  const [showPwaModal, setShowPwaModal] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(null)
  const [installMessage, setInstallMessage] = useState(
    'Instala la app para acceder más rápido y sin conexión.')
  // Captura del evento beforeinstallprompt y mostrar modal 1s después
  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as InstallPrompt)
      // mostrar modal 1s después solo si el evento está disponible
      setTimeout(() => setShowPwaModal(true), 1000)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener)
    }
  }, [])

return <>
      {/* Modal PWA (aparece 1s después) */}
      {showPwaModal && (
        <div
        className="fixed inset-0 bg-foreground/10 flex items-center justify-center z-50 p-4">
          <div
        className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6">
            <div
        className="flex items-start gap-4">
              <img src="/icons/icon-192.png" alt="La Union"
        className="w-12 h-12 rounded" />
              <div>
                <h3
        className="text-lg font-semibold text-foreground">Instala La Union</h3>
                <p
        className="text-sm text-muted-foreground mt-1">{installMessage}</p>
              </div>
            </div>

            <div
        className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPwaModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground
hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt()
                    const choice = await deferredPrompt.userChoice
                    if (choice?.outcome === 'accepted') {
                      setInstallMessage('Gracias por instalar la app')
                    } else {
                      setInstallMessage('Instalación cancelada')
                    }
                    setShowPwaModal(false)
                    setDeferredPrompt(null)
                  } else {
                    // fallback: instrucciones manuales
                    setInstallMessage('Tu navegador no soporta el instalador automático. ' +
                      'Usa el menú del navegador y elige Instalar ' +
                      'o Agregar a la pantalla de inicio.')
                  }
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg
hover:bg-primary/90"
              >
                Instalar app
              </button>
            </div>
          </div>
        </div>
      )}


</>
}
