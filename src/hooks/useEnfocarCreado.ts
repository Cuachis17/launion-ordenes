// Encuentra la tarjeta después del render y la resalta dos segundos sin animación obligatoria.
import { useEffect, useState } from 'react'
import type { AltaCreada } from './useAvisoCreado'
export function useEnfocarCreado() {
  const [objetivo, setObjetivo] = useState<(AltaCreada & { revision: number }) | null>(null)
  useEffect(() => {
    if (!objetivo) return
    let marco = 0
    let temporizador: ReturnType<typeof setTimeout> | undefined
    let tarjeta: HTMLElement | null = null
    // Dos frames permiten que la pestaña y los filtros hayan mostrado la tarjeta.
    marco = requestAnimationFrame(() => {
      marco = requestAnimationFrame(() => {
        const prefijo = objetivo.tipo === 'orden' ? 'orden' : 'comprobante'
        tarjeta = document.getElementById(`${prefijo}-${objetivo.id}`)
        if (!tarjeta) return
        const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        tarjeta.scrollIntoView({ behavior: reducir ? 'instant' : 'smooth', block: 'center' })
        tarjeta.dataset.recienCreado = 'true'
        tarjeta.focus({ preventScroll: true })
        temporizador = setTimeout(() => tarjeta?.removeAttribute('data-recien-creado'), 2000)
      })
    })
    return () => {
      cancelAnimationFrame(marco)
      if (temporizador) clearTimeout(temporizador)
      tarjeta?.removeAttribute('data-recien-creado')
    }
  }, [objetivo])
  function enfocar(alta: AltaCreada) {
    setObjetivo(prev => ({ ...alta, revision: (prev?.revision ?? 0) + 1 }))
  }
  return { objetivo, enfocar }
}
