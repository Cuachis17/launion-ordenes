import { useEffect, useRef, useState, type ReactElement } from 'react'

// Selector de fecha propio (sin librerías) con calendario mensual.
// El valor siempre es 'AAAA-MM-DD' o '' si está vacío.

const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const INICIALES_DIA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function formatearISO(anio: number, mes: number, dia: number): string {
  // mes en base 0 (como Date), se convierte a base 1 para el ISO.
  return `${anio}-${pad2(mes + 1)}-${pad2(dia)}`
}

// Parsea 'AAAA-MM-DD' sin pasar por UTC (new Date('AAAA-MM-DD') resta un día en México).
function parsearISO(valor: string): { anio: number; mes: number; dia: number } | null {
  const partes = valor.split('-')
  if (partes.length !== 3) return null
  const anio = Number(partes[0])
  const mes = Number(partes[1])
  const dia = Number(partes[2])
  if (!anio || !mes || !dia) return null
  return { anio, mes: mes - 1, dia }
}

function formatearVisible(valor: string): string {
  const partes = parsearISO(valor)
  if (!partes) return ''
  return `${pad2(partes.dia)}/${pad2(partes.mes + 1)}/${partes.anio}`
}

// Genera las 6 semanas (42 celdas) del mes visible, empezando en lunes.
// Date normaliza automáticamente días fuera de rango (0, negativos, > días del mes),
// así que este cálculo funciona igual para meses de 28/29/30/31 días.
function obtenerDiasCalendario(anio: number, mes: number): Date[] {
  const primerDia = new Date(anio, mes, 1)
  const offsetLunes = (primerDia.getDay() + 6) % 7 // getDay(): 0=domingo → 0=lunes
  const dias: Date[] = []
  for (let i = 0; i < 42; i++) {
    dias.push(new Date(anio, mes, 1 - offsetLunes + i))
  }
  return dias
}

function esMismoDia(a: Date, anio: number, mes: number, dia: number): boolean {
  return a.getFullYear() === anio && a.getMonth() === mes && a.getDate() === dia
}

export default function CampoFecha({ valor, onCambiar, error, id }: {
  valor: string
  onCambiar: (v: string) => void
  error?: string
  id?: string
}): ReactElement {
  const hoy = new Date()
  const seleccion = parsearISO(valor)

  const [abierto, setAbierto] = useState(false)
  const [anioVista, setAnioVista] = useState(seleccion ? seleccion.anio : hoy.getFullYear())
  const [mesVista, setMesVista] = useState(seleccion ? seleccion.mes : hoy.getMonth())
  const contenedorRef = useRef<HTMLDivElement>(null)

  // Al abrir, muestra el mes de la fecha seleccionada (o el actual si no hay).
  useEffect(() => {
    if (!abierto) return
    const s = parsearISO(valor)
    setAnioVista(s ? s.anio : hoy.getFullYear())
    setMesVista(s ? s.mes : hoy.getMonth())
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function irMesAnterior() {
    if (mesVista === 0) {
      setMesVista(11)
      setAnioVista((a) => a - 1)
    } else {
      setMesVista((m) => m - 1)
    }
  }

  function irMesSiguiente() {
    if (mesVista === 11) {
      setMesVista(0)
      setAnioVista((a) => a + 1)
    } else {
      setMesVista((m) => m + 1)
    }
  }

  function elegirDia(fecha: Date) {
    onCambiar(formatearISO(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()))
    setAbierto(false)
  }

  function irAHoy() {
    const h = new Date()
    onCambiar(formatearISO(h.getFullYear(), h.getMonth(), h.getDate()))
    setAbierto(false)
  }

  const dias = obtenerDiasCalendario(anioVista, mesVista)
  const textoBoton = valor ? formatearVisible(valor) : ''

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
        {textoBoton ? (
          <span className="text-gray-900">{textoBoton}</span>
        ) : (
          <span className="text-gray-400">Elegir fecha</span>
        )}
      </button>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      {abierto && (
        <div
          role="dialog"
          className="absolute z-50 mt-1 left-0 w-[300px] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={irMesAnterior}
              aria-label="Mes anterior"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-900 capitalize">
              {NOMBRES_MES[mesVista]} {anioVista}
            </span>
            <button
              type="button"
              onClick={irMesSiguiente}
              aria-label="Mes siguiente"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {INICIALES_DIA.map((inicial, i) => (
              <div key={i} className="flex h-6 items-center justify-center text-xs font-medium text-gray-500">
                {inicial}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dias.map((fecha, i) => {
              const enMesActual = fecha.getMonth() === mesVista
              const esHoy = esMismoDia(fecha, hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
              const esSeleccionado = seleccion
                ? esMismoDia(fecha, seleccion.anio, seleccion.mes, seleccion.dia)
                : false
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => elegirDia(fecha)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm transition-colors ${
                    esSeleccionado
                      ? 'bg-indigo-600 text-white font-medium'
                      : enMesActual
                        ? 'text-gray-900 hover:bg-gray-100'
                        : 'text-gray-400 hover:bg-gray-100'
                  } ${esHoy && !esSeleccionado ? 'border border-indigo-600' : ''}`}
                >
                  {fecha.getDate()}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={irAHoy}
            className="mt-3 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-indigo-600 hover:bg-gray-50"
          >
            Hoy
          </button>
        </div>
      )}
    </div>
  )
}
