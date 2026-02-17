import { useState } from 'react';
import { Calendar, Users, Clock, Plane, Hotel, Building2, MapPin, DoorClosed } from 'lucide-react';
import type { Reservation } from '../App';

interface ReservationFormProps {
  onSubmit: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => void;
}

export function ReservationForm({ onSubmit }: ReservationFormProps) {
  const [formData, setFormData] = useState({
    agencyName: '',
    service: '',
    date: '',
    hotel: '',
    passengers: '',
    time: '',
    flight: '',
    roomNumber: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      passengers: parseInt(formData.passengers) || 0,
    });
    // Reset form
    setFormData({
      agencyName: '',
      service: '',
      date: '',
      hotel: '',
      passengers: '',
      time: '',
      flight: '',
      roomNumber: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre de la Agencia */}
      <div>
        <label htmlFor="agencyName" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
          <Building2 className="w-4 h-4" />
          Nombre de la Agencia
        </label>
        <input
          type="text"
          id="agencyName"
          name="agencyName"
          value={formData.agencyName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Ej: Transportes Ejecutivos"
        />
      </div>

      {/* Servicio */}
      <div>
        <label htmlFor="service" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
          <MapPin className="w-4 h-4" />
          Servicio
        </label>
        <select
          id="service"
          name="service"
          value={formData.service}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Seleccionar servicio</option>
          <option value="Traslado Aeropuerto - Hotel">Traslado Aeropuerto - Hotel</option>
          <option value="Traslado Hotel - Aeropuerto">Traslado Hotel - Aeropuerto</option>
          <option value="Traslado Ida y Vuelta">Traslado Ida y Vuelta</option>
          <option value="Tour Privado">Tour Privado</option>
          <option value="Servicio por Horas">Servicio por Horas</option>
        </select>
      </div>

      {/* Fecha y Hora */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4" />
            Fecha
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="time" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Clock className="w-4 h-4" />
            Hora
          </label>
          <input
            type="text"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ej: 14:30"
            title="Formato: HH:MM (Ej: 14:30)"
          />
        </div>
      </div>

      {/* Hotel */}
      <div>
        <label htmlFor="hotel" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
          <Hotel className="w-4 h-4" />
          Hotel
        </label>
        <input
          type="text"
          id="hotel"
          name="hotel"
          value={formData.hotel}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Ej: Hotel Paradisus"
        />
      </div>

      {/* Número de Pasajeros y Habitación */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="passengers" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Users className="w-4 h-4" />
            Pasajeros
          </label>
          <input
            type="number"
            id="passengers"
            name="passengers"
            value={formData.passengers}
            onChange={handleChange}
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        <div>
          <label htmlFor="roomNumber" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <DoorClosed className="w-4 h-4" />
            Habitación
          </label>
          <input
            type="text"
            id="roomNumber"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ej: 301"
          />
        </div>
      </div>

      {/* Vuelo */}
      <div>
        <label htmlFor="flight" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
          <Plane className="w-4 h-4" />
          Número de Vuelo
        </label>
        <input
          type="text"
          id="flight"
          name="flight"
          value={formData.flight}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Ej: AA1234"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
      >
        Crear Reserva
      </button>
    </form>
  );
}