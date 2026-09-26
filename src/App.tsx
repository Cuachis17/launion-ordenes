import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import ReservationForm from './components/ReservationForm'
import AppDrawer, { APPS, type AppId } from './components/AppDrawer'
import ReceiptForm from './components/ReceiptForm'
import ReceiptList from './components/ReceiptList'
import EditReceiptModal from './components/EditReceiptModal'
import { loadReceipts, saveReceipts } from './utils/receiptStorage'
import { siguienteVoucher, type Receipt } from './types'
import ReservationList from './components/ReservationList'
import EditReservationModal from './components/EditReservationModal'
import Login from './components/Login'
import UserProfileModal from './components/UserProfileModal'
import Register from './components/Register'
import ChangePasswordModal from './components/ChangePasswordModal'
import { loadOrders, saveOrders, loadCompany, saveCompany } from './utils/storage'
import type { Order, CompanyInfo } from './types'
import CotizadorTraslados from './components/CotizadorTraslados'

export default function App() {
  const [reservations, setReservations] = useState<Order[]>(() => loadOrders())
  const [appActiva, setAppActiva] = useState<AppId>('ordenes')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [receipts, setReceipts] = useState<Receipt[]>(() => loadReceipts())
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  // En teléfono no caben formulario y lista a la vez: se alternan con pestañas.
  // Desde lg: los dos paneles se muestran juntos y las pestañas desaparecen.
  const [panelMovil, setPanelMovil] = useState<'form' | 'lista'>('form')
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => loadCompany())
  const [showCompanyEditor, setShowCompanyEditor] = useState(false)
  const [tempRazonSocial, setTempRazonSocial] = useState(companyInfo.razonSocial || '')
  const [tempDireccion, setTempDireccion] = useState(companyInfo.direccion || '')
  const [tempSict, setTempSict] = useState(companyInfo.sict || '')
  const [tempCobranza, setTempCobranza] = useState(companyInfo.cobranza || '')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
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

  useEffect(() => {
    setPanelMovil('form')
  }, [appActiva])

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

  function handleAddReceipt(entrante: Receipt) {
    // El voucher es opcional al capturar: si viene vacío se asigna el siguiente
    // de la serie, para que ningún comprobante quede sin folio.
    const r: Receipt = entrante.voucher.trim()
      ? { ...entrante, voucher: entrante.voucher.trim() }
      : { ...entrante, voucher: siguienteVoucher(receipts) }
    const siguientes = [r, ...receipts]
    setReceipts(siguientes)
    if (!saveReceipts(siguientes)) {
      alert('No se pudo guardar el comprobante: el almacenamiento del navegador está lleno o bloqueado.')
    }
  }

  // Duplicar es lo más pedido en operación: el mismo traslado con otro pasajero.
  function handleDuplicateReceipt(r: Receipt) {
    setEditingReceipt({
      ...r,
      id: crypto.randomUUID(),
      voucher: '',
      passenger: '',
      generatedAt: new Date().toISOString(),
    })
  }

  function handleSaveEditedReceipt(r: Receipt) {
    const existe = receipts.some((x) => x.id === r.id)
    const siguientes = existe ? receipts.map((x) => (x.id === r.id ? r : x)) : [r, ...receipts]
    setReceipts(siguientes)
    saveReceipts(siguientes)
    setEditingReceipt(null)
  }

  function handleDeleteReceipt(id: string) {
    const siguientes = receipts.filter((x) => x.id !== id)
    setReceipts(siguientes)
    saveReceipts(siguientes)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header
        count={appActiva === 'ordenes' ? reservations.length : appActiva === 'comprobantes' ? receipts.length : 0}
        onOpenEditor={handleOpenEditor}
        onLoginClick={() => setShowLoginModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
        onOpenMenu={() => setMenuAbierto(true)}
        subtitulo={APPS.find((a) => a.id === appActiva)?.nombre ?? ''}
        unidad={appActiva === 'ordenes'
          ? ['reserva activa', 'reservas activas']
          : appActiva === 'comprobantes'
            ? ['comprobante emitido', 'comprobantes emitidos']
            : ['consulta realizada', 'consultas realizadas']}
        user={user}
        mostrarResumen={appActiva !== 'cotizador'}
      />

      <AppDrawer
        abierto={menuAbierto}
        activa={appActiva}
        onElegir={setAppActiva}
        onCerrar={() => setMenuAbierto(false)}
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
          onRegisterClick={() => {
            setShowProfileModal(false)
            setShowRegisterModal(true)
          }}
          onChangePasswordClick={() => {
            setShowProfileModal(false)
            setShowChangePasswordModal(true)
          }}
        />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}

      {showRegisterModal && (
        <Register
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowRegisterModal(false)
            alert('Usuario registrado exitosamente')
          }}
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
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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

      {appActiva === 'ordenes' && (
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-8 max-w-6xl">
        <PestanasMovil
          valor={panelMovil}
          onCambiar={setPanelMovil}
          etiquetas={['Nueva reserva', `Reservas (${reservations.length})`]}
        />
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-8 items-start">
          {/* Form Section */}
          <div className={`bg-white rounded-xl shadow-lg p-3 sm:p-6 min-w-0 ${
            panelMovil === 'form' ? '' : 'hidden lg:block'}`}>
            <h2 className="hidden lg:block text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Nueva Reserva</h2>
            <ReservationForm onSubmit={handleAddReservation} />
          </div>

          {/* List Section */}
          <div className={`bg-white rounded-xl shadow-lg p-3 sm:p-6 min-w-0 ${
            panelMovil === 'lista' ? '' : 'hidden lg:block'}`}>
            <h2 className="hidden lg:block text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Reservas Recientes</h2>
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
      )}

      {appActiva === 'comprobantes' && (
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-8 max-w-6xl">
          <PestanasMovil
            valor={panelMovil}
            onCambiar={setPanelMovil}
            etiquetas={['Nuevo comprobante', `Comprobantes (${receipts.length})`]}
          />
          <div className="grid lg:grid-cols-5 gap-5 lg:gap-8 items-start">
            <div className={`bg-white rounded-xl shadow-lg p-3 sm:p-6 lg:col-span-3 min-w-0 ${
              panelMovil === 'form' ? '' : 'hidden lg:block'}`}>
              <h2 className="hidden lg:block text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Nuevo comprobante</h2>
              {user
                ? <ReceiptForm onSubmit={handleAddReceipt} />
                : <SesionRequerida onIniciar={() => setShowLoginModal(true)} />}
            </div>
            <div className={`bg-white rounded-xl shadow-lg p-3 sm:p-6 lg:col-span-2 min-w-0 ${
              panelMovil === 'lista' ? '' : 'hidden lg:block'}`}>
              <h2 className="hidden lg:block text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Comprobantes recientes</h2>
              <ReceiptList
                receipts={receipts}
                onDelete={handleDeleteReceipt}
                onEdit={user ? setEditingReceipt : undefined}
                onDuplicate={user ? handleDuplicateReceipt : undefined}
                companyInfo={companyInfo}
                user={user}
              />
            </div>
          </div>
        </div>
      )}

      {appActiva === 'cotizador' && <CotizadorTraslados />}

      {editingReceipt && (
        <EditReceiptModal
          receipt={editingReceipt}
          onClose={() => setEditingReceipt(null)}
          onSave={handleSaveEditedReceipt}
        />
      )}

      {editingReservation && (
        <EditReservationModal reservation={editingReservation} onClose={() => setEditingReservation(null)} onSave={handleSaveEditedReservation} />
      )}
    </div>
  )
}

// Un comprobante de venta debe poder atribuirse a quien lo emitió, y su logo
// sale del perfil de esa sesión. Sin usuario no se captura.
function SesionRequerida({ onIniciar }: { onIniciar: () => void }) {
  return (
    <div className="py-10 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-indigo-50 grid place-items-center mb-4">
        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.7">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <p className="text-gray-900 font-semibold">Inicia sesión para emitir comprobantes</p>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">
        El comprobante lleva tu logo y queda a nombre de quien lo emite, así que necesita una sesión activa.
      </p>
      <button
        onClick={onIniciar}
        className="mt-5 px-5 h-11 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
      >
        Iniciar sesión
      </button>
    </div>
  )
}

// En teléfono no caben formulario y lista a la vez: se alternan con estas
// pestañas. Desde lg los dos paneles se ven juntos y las pestañas desaparecen.
function PestanasMovil({
  valor, onCambiar, etiquetas,
}: {
  valor: 'form' | 'lista'
  onCambiar: (v: 'form' | 'lista') => void
  etiquetas: [string, string]
}) {
  const opciones: Array<'form' | 'lista'> = ['form', 'lista']
  return (
    <div className="lg:hidden mb-2 grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/70 border border-gray-200 shadow-sm">
      {opciones.map((op, i) => (
        <button
          key={op}
          onClick={() => onCambiar(op)}
          aria-current={valor === op ? 'page' : undefined}
          className={`h-9 rounded-lg text-sm font-medium transition-colors ${
            valor === op ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {etiquetas[i]}
        </button>
      ))}
    </div>
  )
}
