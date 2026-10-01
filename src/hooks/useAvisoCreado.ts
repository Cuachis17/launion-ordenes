// Aviso efímero de alta: conserva el tiempo restante mientras se interactúa con él.
import { useCallback, useEffect, useRef, useState } from 'react'
export type AltaCreada = { tipo: 'orden' | 'comprobante'; id: string }
const DURACION = 8000
export function useAvisoCreado() {
  const [aviso, setAviso] = useState<AltaCreada | null>(null)
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activo = useRef(false)
  const inicio = useRef(0)
  const restante = useRef(DURACION)
  const pausas = useRef(new Set<string>())
  const cerrar = useCallback(() => {
    if (reloj.current) clearTimeout(reloj.current)
    reloj.current = null
    activo.current = false
    pausas.current.clear()
    setAviso(null)
  }, [])
  const iniciar = useCallback(() => {
    if (!activo.current || pausas.current.size) return
    if (reloj.current) clearTimeout(reloj.current)
    inicio.current = Date.now()
    reloj.current = setTimeout(cerrar, Math.max(0, restante.current))
  }, [cerrar])
  const pausar = useCallback((motivo: string) => {
    if (!pausas.current.size && reloj.current) {
      clearTimeout(reloj.current)
      reloj.current = null
      restante.current = Math.max(0, restante.current - (Date.now() - inicio.current))
    }
    pausas.current.add(motivo)
  }, [])
  const reanudar = useCallback((motivo: string) => {
    if (!pausas.current.has(motivo)) return
    pausas.current.delete(motivo)
    if (!pausas.current.size) iniciar()
  }, [iniciar])
  function mostrar(tipo: AltaCreada['tipo'], id: string) {
    activo.current = true
    restante.current = DURACION
    pausas.current.clear()
    setAviso({ tipo, id })
  }
  useEffect(() => {
    activo.current = !!aviso
    if (aviso) iniciar()
    return () => {
      activo.current = false
      if (reloj.current) clearTimeout(reloj.current)
      reloj.current = null
    }
  }, [aviso, iniciar])
  return { aviso, mostrar, cerrar, pausar, reanudar }
}
