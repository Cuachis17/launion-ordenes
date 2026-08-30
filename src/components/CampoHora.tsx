import { useEffect, useRef, useState, type ReactElement } from 'react'

// Selector de hora propio (sin librerías), siempre en 24 horas.
// Existe porque el <input type="time"> nativo depende del idioma del teléfono
// y a veces pinta 12h/24h sin poder forzarlo: en traslados al aeropuerto,
// confundir 04:00 con 16:00 le cuesta el vuelo al pasajero.

const HORAS = Array.from({ length: 24 }, (_, i) => i) // 0..23
const MINUTOS = Array.from({ length: 12 }, (_, i) => i * 5) // 0,5,...,55
const ACCESOS_RAPIDOS = ['04:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function parsear(valor: string): { hora: number; minuto: number } | null {
  const partes = valor.split(':')
  if (partes.length !== 2) return null
  const hora = Number(partes[0])
  const minuto = Number(partes[1])
  if (Number.isNaN(hora) || Number.isNaN(minuto)) return null
  return { hora, minuto }
}

export default function CampoHora({ valor, onCambiar, error, id }: {
  valor: string
  onCambiar: (v: string) => void
  error?: string
  id?: string
}): ReactElement {
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const horaRef = useRef<HTMLButtonElement>(null)
  const minutoRef = useRef<HTMLButtonElement>(null)

  const actual = parsear(valor)
  // Base para aplicar en el momento aunque solo se haya elegido una columna.
  const horaActual = actual ? actual.hora : 0
  const minutoActual = actual ? actual.minuto : 0

  useEffect(() => {
    if (!abierto) return
    horaRef.current?.scrollIntoView({ block: 'center' })
    minutoRef.current?.scrollIntoView({ block: 'center' })
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    function alTocarFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', alTocarFuera)
    document.addEventListener('keydown', alPresionarTecla)
    return () => {
      document.removeEventListener('mousedown', alTocarFuera)
      document.removeEventListener('keydown', alPresionarTecla)
    }
  }, [abierto])

  function elegirHora(hora: number) {
    onCambiar(`${pad2(hora)}:${pad2(minutoActual)}`)
  }

  function elegirMinuto(minuto: number) {
    onCambiar(`${pad2(horaActual)}:${pad2(minuto)}`)
  }

  function elegirAcceso(hhmm: string) {
    onCambiar(hhmm)
    setAbierto(false)
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        id={id}
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className="mt-0.5 sm:mt-1 flex h-[42px] w-full items-center rounded-lg border border-gray-200 bg-white px-3 text-left shadow-sm"
      >
        {valor ? (
          <span className="text-gray-900">{valor}</span>
        ) : (
          <span className="text-gray-400">Elegir hora</span>
        )}
      </button>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      {abierto && (
        <div
          role="dialog"
          className="absolute z-50 mt-1 right-0 w-[260px] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-1 text-center text-xs font-medium text-gray-500">Hora</p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100">
                {HORAS.map((h) => {
                  const seleccionada = actual !== null && h === horaActual
                  return (
                    <button
                      key={h}
                      type="button"
                      ref={seleccionada ? horaRef : undefined}
                      onClick={() => elegirHora(h)}
                      className={`flex h-10 w-full items-center justify-center text-sm transition-colors ${
                        seleccionada ? 'bg-indigo-600 text-white font-medium' : 'text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {pad2(h)}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-center text-xs font-medium text-gray-500">Min</p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100">
                {MINUTOS.map((m) => {
                  const seleccionado = actual !== null && m === minutoActual
                  return (
                    <button
                      key={m}
                      type="button"
                      ref={seleccionado ? minutoRef : undefined}
                      onClick={() => elegirMinuto(m)}
                      className={`flex h-10 w-full items-center justify-center text-sm transition-colors ${
                        seleccionado ? 'bg-indigo-600 text-white font-medium' : 'text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {pad2(m)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-gray-500">Horarios frecuentes</p>
            <div className="flex flex-wrap gap-1.5">
              {ACCESOS_RAPIDOS.map((hhmm) => (
                <button
                  key={hhmm}
                  type="button"
                  onClick={() => elegirAcceso(hhmm)}
                  className={`rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors ${
                    valor === hhmm
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {hhmm}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
