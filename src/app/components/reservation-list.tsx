import { Download, Trash2, Calendar, Clock, Users, Plane } from 'lucide-react';
import { generatePDF } from '../utils/pdf-generator';
import type { Reservation, CompanyInfo } from '../App';

interface ReservationListProps {
  reservations: Reservation[];
  onDelete: (id: string) => void;
  companyInfo: CompanyInfo;
}

export function ReservationList({ reservations, onDelete, companyInfo }: ReservationListProps) {
  const handleDownloadPDF = (reservation: Reservation) => {
    generatePDF(reservation, companyInfo);
  };

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No hay reservas aún</p>
        <p className="text-sm mt-2">Crea tu primera reserva usando el formulario</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
      {reservations.map((reservation) => (
        <div
          key={reservation.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{reservation.agencyName}</h3>
              <p className="text-sm text-gray-600">{reservation.service}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownloadPDF(reservation)}
                className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                title="Descargar PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(reservation.id)}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{reservation.date}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{reservation.time}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span>{reservation.passengers} pasajeros</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Plane className="w-4 h-4" />
              <span>{reservation.flight}</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-600">
            <p><span className="font-medium">Hotel:</span> {reservation.hotel}</p>
            <p><span className="font-medium">Habitación:</span> {reservation.roomNumber}</p>
          </div>
        </div>
      ))}
    </div>
  );
}