// Aplicación y navegación entre herramientas de operación.
import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import AppDrawer from './components/AppDrawer'
import { APPS } from './components/apps'
import EditReceiptModal from './components/EditReceiptModal'
import EditReservationModal from './components/EditReservationModal'
import Login from './components/Login'
import UserProfileModal from './components/UserProfileModal'
import Register from './components/Register'
import ChangePasswordModal from './components/ChangePasswordModal'
import CotizadorTraslados from './components/CotizadorTraslados'
import PanelUsuarios from './components/admin/PanelUsuarios'
import CompanyEditor from './components/CompanyEditor'
import PwaInstall from './components/PwaInstall'
import OperationalPanels from './components/OperationalPanels'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useAppData } from './hooks/useAppData'
import { useSession, AVISO_SUSPENSION } from './hooks/useSession'

export default function App() {
  const data = useAppData()
  const { reservations, receipts, companyInfo, setCompanyInfo, editingReceipt,
    setEditingReceipt, editingReservation, setEditingReservation, handleSaveEditedReceipt,
    handleSaveEditedReservation } = data
  const { user, suspendida, checkAuth, logout } = useSession()
  const { appActiva: activa, elegir, panelMovil, setPanelMovil } = useAppNavigation(user?.role)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [showCompanyEditor, setShowCompanyEditor] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  async function handleLogout() {
    await logout()
    setShowProfileModal(false)
    elegir('ordenes')
  }
  return (
    <div
        className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header
        count={activa === 'ordenes' ? reservations.length
          : activa === 'comprobantes' ? receipts.length : 0}
        onOpenEditor={() => setShowCompanyEditor(true)}
        onLoginClick={() => setShowLoginModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
        onOpenMenu={() => setMenuAbierto(true)}
        subtitulo={APPS.find((a) => a.id === activa)?.nombre ?? ''}
        unidad={activa === 'ordenes'
          ? ['reserva activa', 'reservas activas']
          : activa === 'comprobantes'
            ? ['comprobante emitido', 'comprobantes emitidos']
            : ['consulta realizada', 'consultas realizadas']}
        user={user}
        mostrarResumen={activa !== 'cotizador' && activa !== 'usuarios'}
      />

      {suspendida && <p
        role="alert"
        className="bg-card p-4 text-center">
        {AVISO_SUSPENSION}
      </p>}

      <AppDrawer
        role={user?.role}
        abierto={menuAbierto}
        activa={activa}
        onElegir={elegir}
        onCerrar={() => setMenuAbierto(false)}
      />

      {/* Modal de Perfil de Usuario */}
      {showProfileModal && user && (
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

      {showCompanyEditor && <CompanyEditor
        companyInfo={companyInfo} abierto
        isRoot={!!user}
        onCerrar={() => setShowCompanyEditor(false)}
        onGuardar={setCompanyInfo} />}

      <PwaInstall />
      <OperationalPanels data={data}
        activa={activa} elegir={elegir}
        user={user} panelMovil={panelMovil}
        setPanelMovil={setPanelMovil}
        setShowLoginModal={setShowLoginModal} />
      {activa === 'usuarios' && user?.role === 'admin' &&
        <PanelUsuarios
        usuarioId={user._id}
        onSesionCambio={checkAuth} />}

      {activa === 'cotizador' && <CotizadorTraslados />}

      {editingReceipt && user && (
        <EditReceiptModal
          receipt={editingReceipt}
          onClose={() => setEditingReceipt(null)}
          onSave={handleSaveEditedReceipt}
        />
      )}

      {editingReservation && (
        <EditReservationModal reservation={editingReservation}
        onClose={() => setEditingReservation(null)}
        onSave={handleSaveEditedReservation} />
      )}
    </div>
  )
}
