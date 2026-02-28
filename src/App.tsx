import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import ReservationForm from './components/ReservationForm'
import ReservationList from './components/ReservationList'
import EditReservationModal from './components/EditReservationModal'
import Login from './components/login'
import UserProfileModal from './components/UserProfileModal'
import { loadOrders, saveOrders, loadCompany, saveCompany } from './utils/storage'
import type { Order, CompanyInfo } from './types'

export default function App() {
  const [reservations, setReservations] = useState<Order[]>(() => loadOrders())
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => loadCompany())
  const [showCompanyEditor, setShowCompanyEditor] = useState(false)
  const [tempRazonSocial, setTempRazonSocial] = useState(companyInfo.razonSocial || '')
  const [tempDireccion, setTempDireccion] = useState(companyInfo.direccion || '')
  const [tempSict, setTempSict] = useState(companyInfo.sict || '')
  const [tempCobranza, setTempCobranza] = useState(companyInfo.cobranza || '')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [user, setUser] = useState<any>(null)

  const apiUrl = import.meta.env.VITE_API_URL

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

  // Load data on mount and check auth
  useEffect(() => {
    checkAuth()
    const savedOrders = loadOrders()
    if (savedOrders.length > 0) setReservations(savedOrders)

    setCompanyInfo(loadCompany())
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch(`${apiUrl}/api/verify`, {
        method: 'GET',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error verifying auth:', error)
      setUser(null)
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${apiUrl}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
      setShowProfileModal(false)
    } catch (error) {
      console.error('Error logging out:', error)
      setUser(null)
      setShowProfileModal(false)
    }
  }

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
    setTempDireccion(companyInfo.direccion || '')
    setTempSict(companyInfo.sict || '')
    setTempCobranza(companyInfo.cobranza || '')
    setShowCompanyEditor(true)
  }

  function handleCancelEdit() {
    setShowCompanyEditor(false)
  }

  function handleSaveCompanyInfo() {
    setCompanyInfo({
      razonSocial: tempRazonSocial.trim() || undefined,
      direccion: tempDireccion.trim() || undefined,
      sict: tempSict.trim() || undefined,
      cobranza: tempCobranza.trim() || undefined,
    })
    setShowCompanyEditor(false)
  }

  const isRoot = !!user

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <Header
        count={reservations.length}
        onOpenEditor={handleOpenEditor}
        onLoginClick={() => setShowLoginModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
        user={user}
      />

      {/* Modal de Perfil de Usuario */}
      {showProfileModal && (
        <UserProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdateSuccess={() => {
            checkAuth() // Refresh user data to show new avatar
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Modal de Login */}
      {showLoginModal && (
        <Login
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={() => {
            setShowLoginModal(false)
            checkAuth()
          }}
        />
      )}

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
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social / Dirección
                </label>
                <input
                  id="razonSocial"
                  type="text"
                  value={tempRazonSocial}
                  onChange={(e) => setTempRazonSocial(e.target.value)}
                  placeholder="Ej: Servans Travel S.A. de C.V."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2 mb-4">
                  Si se deja vacío, no aparecerá en el encabezado del PDF
                </p>

                <label htmlFor="direccion" className={`block text-sm font-medium mb-2 ${isRoot ? 'text-gray-700' : 'text-gray-400'}`}>
                  Dirección
                </label>
                <input
                  id="direccion"
                  type="text"
                  value={tempDireccion}
                  onChange={(e) => setTempDireccion(e.target.value)}
                  disabled={!isRoot}
                  placeholder="Ej: Calle Principal 123"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4 ${!isRoot ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500' : 'border-gray-300'}`}
                />

                <label htmlFor="sict" className={`block text-sm font-medium mb-2 ${isRoot ? 'text-gray-700' : 'text-gray-400'}`}>
                  Permiso SICT
                </label>
                <input
                  id="sict"
                  type="text"
                  value={tempSict}
                  onChange={(e) => setTempSict(e.target.value)}
                  disabled={!isRoot}
                  placeholder="Ej: 123456789"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4 ${!isRoot ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500' : 'border-gray-300'}`}
                />

                <label htmlFor="cobranza" className={`block text-sm font-medium mb-2 ${isRoot ? 'text-gray-700' : 'text-gray-400'}`}>
                  Teléfono de Cobranza
                </label>
                <input
                  id="cobranza"
                  type="text"
                  value={tempCobranza}
                  onChange={(e) => setTempCobranza(e.target.value)}
                  disabled={!isRoot}
                  placeholder="Ej: 555 123 4567"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${!isRoot ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500' : 'border-gray-300'}`}
                />
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
            <ReservationList
              reservations={reservations}
              onDelete={handleDeleteReservation}
              onEdit={handleEditClick}
              companyInfo={companyInfo}
              user={user}
            />
          </div>
        </div>
      </div>
      {editingReservation && (
        <EditReservationModal reservation={editingReservation} onClose={() => setEditingReservation(null)} onSave={handleSaveEditedReservation} />
      )}
    </div>
  )
}
