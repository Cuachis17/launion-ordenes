import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import ReservationForm from './components/ReservationForm'
import ReservationList from './components/ReservationList'
import EditReservationModal from './components/EditReservationModal'
import { loadOrders, saveOrders, loadCompany, saveCompany } from './utils/storage'
import type { Order, CompanyInfo } from './types'

export default function App() {
  const [reservations, setReservations] = useState<Order[]>(() => loadOrders())
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => loadCompany())
  const [showCompanyEditor, setShowCompanyEditor] = useState(false)
  const [tempRazonSocial, setTempRazonSocial] = useState(companyInfo.razonSocial || '')
  // PWA install prompt state
  const [showPwaModal, setShowPwaModal] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installMessage, setInstallMessage] = useState('Instala la app para acceder más rápido y sin conexión.')
  const [editingReservation, setEditingReservation] = useState<Order | null>(null)

  useEffect(() => {
    saveOrders(reservations)
  }, [reservations])

  // Captura del evento beforeinstallprompt y mostrar modal 1s después
  useEffect(() => {
    function onBeforeInstall(e: any) {
      e.preventDefault()
      setDeferredPrompt(e)
      // mostrar modal 1s después solo si el evento está disponible
      setTimeout(() => setShowPwaModal(true), 1000)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener)
    }
  }, [])

  useEffect(() => {
    saveCompany(companyInfo)
  }, [companyInfo])

  function handleAddReservation(o: Order) {
    setReservations((prev) => [o, ...prev].slice(0, 10))
  }

  function handleDeleteReservation(id: string) {
    setReservations((prev) => prev.filter((r) => r.id !== id))
  }

  function handleEditClick(o: Order) {
    setEditingReservation(o)
  }

  function handleSaveEditedReservation(o: Order) {
    setReservations(prev => prev.map(r => r.id === o.id ? o : r))
    setEditingReservation(null)
  }

  function handleOpenEditor() {
    setTempRazonSocial(companyInfo.razonSocial || '')
    setShowCompanyEditor(true)
  }

  function handleCancelEdit() {
    setShowCompanyEditor(false)
  }

  function handleSaveCompanyInfo() {
    setCompanyInfo({ razonSocial: tempRazonSocial.trim() || undefined })
    setShowCompanyEditor(false)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <Header count={reservations.length} onOpenEditor={handleOpenEditor} />

      {/* Modal de Edición de Información de Empresa */}
      {showCompanyEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Configuración del PDF</h2>
              <button
                onClick={handleCancelEdit}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social
                </label>
                <input
                  id="razonSocial"
                  type="text"
                  value={tempRazonSocial}
                  onChange={(e) => setTempRazonSocial(e.target.value)}
                  placeholder="Ej: Servans Travel S.A. de C.V."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Si se deja vacío, no aparecerá en el encabezado del PDF
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCompanyInfo}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PWA (aparece 1s después) */}
      {showPwaModal && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <img src="/icons/icon-192.png" alt="La Union" className="w-12 h-12 rounded" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Instala La Union</h3>
                <p className="text-sm text-gray-500 mt-1">{installMessage}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPwaModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
                    setInstallMessage('Tu navegador no soporta el instalador automático. Usa el menú del navegador y elige "Instalar" o "Agregar a la pantalla de inicio".')
                  }
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Instalar app
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Nueva Reserva</h2>
            <ReservationForm onSubmit={handleAddReservation} />
          </div>

          {/* List Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Reservas Recientes</h2>
            <ReservationList reservations={reservations} onDelete={handleDeleteReservation} onEdit={handleEditClick} companyInfo={companyInfo} />
          </div>
        </div>
      </div>
      {editingReservation && (
        <EditReservationModal reservation={editingReservation} onClose={() => setEditingReservation(null)} onSave={handleSaveEditedReservation} />
      )}
    </div>
  )
}
