// Paneles de captura y consulta pública de órdenes y comprobantes.
import ReservationForm from './ReservationForm'
import ReservationList from './ReservationList'
import ReceiptForm from './ReceiptForm'
import ReceiptList from './ReceiptList'
import { PestanasMovil, SesionRequerida } from './PanelHelpers'
import type { useAppData } from '../hooks/useAppData'
import type { SessionUser } from '../hooks/useSession'
import type { AppId } from './apps'
export default function OperationalPanels({ data, activa, user, panelMovil, setPanelMovil,
 setShowLoginModal }: {
 data: ReturnType<typeof useAppData>
 activa: AppId
 user: SessionUser | null
 panelMovil: 'form' | 'lista'
 setPanelMovil: (panel: 'form' | 'lista') => void
 setShowLoginModal: (show: boolean) => void
}) {
 const {
  reservations, receipts, companyInfo, setEditingReceipt, handleAddReservation,
  handleDeleteReservation, handleEditClick, handleAddReceipt, handleDuplicateReceipt,
  handleDeleteReceipt
} = data
 return <>
      {activa === 'ordenes' && (
      <div
        className="container mx-auto px-3 sm:px-4 py-2 sm:py-8 max-w-6xl">
        <PestanasMovil
          valor={panelMovil}
          onCambiar={setPanelMovil}
          etiquetas={['Nueva reserva', `Reservas (${reservations.length})`]}
        />
        <div
        className="grid lg:grid-cols-2 gap-5 lg:gap-8 items-start">
          {/* Form Section */}
          <div
        className={`bg-card rounded-xl shadow-lg p-3 sm:p-6 min-w-0 ${
            panelMovil === 'form' ? '' : 'hidden lg:block'}`}>
            <h2
        className="hidden lg:block text-xl sm:text-2xl font-semibold text-foreground
mb-4 sm:mb-6">Nueva Reserva</h2>
            <ReservationForm
        onSubmit={handleAddReservation} />
          </div>

          {/* List Section */}
          <div
        className={`bg-card rounded-xl shadow-lg p-3 sm:p-6 min-w-0 ${
            panelMovil === 'lista' ? '' : 'hidden lg:block'}`}>
            <h2
        className="hidden lg:block text-xl sm:text-2xl font-semibold text-foreground
mb-4 sm:mb-6">Reservas Recientes</h2>
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

      {activa === 'comprobantes' && (
        <div
        className="container mx-auto px-3 sm:px-4 py-2 sm:py-8 max-w-6xl">
          <PestanasMovil
            valor={panelMovil}
            onCambiar={setPanelMovil}
            etiquetas={['Nuevo comprobante', `Comprobantes (${receipts.length})`]}
          />
          <div
        className="grid lg:grid-cols-5 gap-5 lg:gap-8 items-start">
            <div
        className={`bg-card rounded-xl shadow-lg p-3 sm:p-6 lg:col-span-3 min-w-0 ${
              panelMovil === 'form' ? '' : 'hidden lg:block'}`}>
              <h2
        className="hidden lg:block text-xl sm:text-2xl font-semibold text-foreground
mb-4 sm:mb-6">Nuevo comprobante</h2>
              {user
                ? <ReceiptForm
        onSubmit={handleAddReceipt} />
                : <SesionRequerida onIniciar={() => setShowLoginModal(true)} />}
            </div>
            <div
        className={`bg-card rounded-xl shadow-lg p-3 sm:p-6 lg:col-span-2 min-w-0 ${
              panelMovil === 'lista' ? '' : 'hidden lg:block'}`}>
              <h2
        className="hidden lg:block text-xl sm:text-2xl font-semibold text-foreground
mb-4 sm:mb-6">Comprobantes recientes</h2>
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

 </>
}
