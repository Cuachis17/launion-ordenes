import { useState, useEffect } from 'react';
import { ReservationForm } from './components/reservation-form';
import { ReservationList } from './components/reservation-list';
import { FileText, Pencil, X } from 'lucide-react';
import { setCookie, getCookie } from './utils/cookies';

export interface Reservation {
  id: string;
  agencyName: string;
  service: string;
  date: string;
  hotel: string;
  passengers: number;
  time: string;
  flight: string;
  roomNumber: string;
  createdAt: Date;
}

const STORAGE_KEY = 'transportation_reservations';
const COMPANY_INFO_COOKIE = 'company_razon_social';

export interface CompanyInfo {
  razonSocial: string;
}

export default function App() {
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    // Cargar reservas desde localStorage al iniciar
    try {
      const savedReservations = localStorage.getItem(STORAGE_KEY);
      if (savedReservations) {
        const parsed = JSON.parse(savedReservations);
        // Convertir las fechas de string a Date
        return parsed.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
        }));
      }
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    }
    return [];
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    // Cargar desde cookies
    const savedRazonSocial = getCookie(COMPANY_INFO_COOKIE);
    return {
      razonSocial: savedRazonSocial || ''
    };
  });

  const [showCompanyEditor, setShowCompanyEditor] = useState(false);
  const [tempRazonSocial, setTempRazonSocial] = useState('');

  // Guardar reservas en localStorage cada vez que cambien
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    } catch (error) {
      console.error('Error al guardar reservas:', error);
    }
  }, [reservations]);

  // Guardar información de empresa
  useEffect(() => {
    try {
      setCookie(COMPANY_INFO_COOKIE, companyInfo.razonSocial);
    } catch (error) {
      console.error('Error al guardar información de empresa:', error);
    }
  }, [companyInfo]);

  const handleAddReservation = (reservation: Omit<Reservation, 'id' | 'createdAt'>) => {
    const newReservation: Reservation = {
      ...reservation,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setReservations([newReservation, ...reservations]);
  };

  const handleDeleteReservation = (id: string) => {
    setReservations(reservations.filter(r => r.id !== id));
  };

  const handleOpenEditor = () => {
    setTempRazonSocial(companyInfo.razonSocial);
    setShowCompanyEditor(true);
  };

  const handleSaveCompanyInfo = () => {
    setCompanyInfo({ razonSocial: tempRazonSocial });
    setShowCompanyEditor(false);
  };

  const handleCancelEdit = () => {
    setTempRazonSocial('');
    setShowCompanyEditor(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Fijo */}
      <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">La Union</h1>
                <p className="text-xs text-gray-500">Registro de Reservas</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-700 font-medium">Sistema de Transportación</p>
                <p className="text-xs text-gray-500">{reservations.length} {reservations.length === 1 ? 'reserva' : 'reservas'} activas</p>
              </div>
              <button
                onClick={handleOpenEditor}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Editar información del PDF"
              >
                <Pencil className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

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
                <X className="w-5 h-5 text-gray-500" />
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
              companyInfo={companyInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}