// Selector compartido de órdenes: conserva los servicios libres al volver a editarlos.
import { useId, useState } from 'react'

const OPCIONES = ['Llegada', 'Salida', 'InterHotel', 'Tour']
const CAMPO = 'mt-1 w-full min-w-0 rounded-lg border border-border bg-input-background '
  + 'px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-ring'

export default function SelectorServicio({ value, onChange }: {
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()
  // Mantiene Otro mientras se escribe, incluso si el texto coincide con una opción fija.
  const [seleccion, setSeleccion] = useState(() => OPCIONES.includes(value) ? value : 'Otro')
  const [texto, setTexto] = useState(() =>
    OPCIONES.includes(value) || value === 'Otro' ? '' : value)
  const otro = seleccion === 'Otro'
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-medium">Servicio</label>
      <select id={id} value={seleccion} className={CAMPO}
        onChange={(event) => {
          setSeleccion(event.target.value)
          setTexto('')
          onChange(event.target.value)
        }}>
        {OPCIONES.map((opcion) => <option key={opcion}>{opcion}</option>)}
        <option>Otro</option>
      </select>
      {otro && (
        <label className="mt-2 block text-sm font-medium">
          ¿Qué servicio?
          <input value={texto} placeholder="Ej: Boda en Xcaret"
            className={CAMPO} onChange={(event) => {
              setTexto(event.target.value)
              onChange(event.target.value || 'Otro')
            }} />
        </label>
      )}
    </div>
  )
}
