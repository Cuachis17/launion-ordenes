// Confirmación de alta con acciones inmediatas, pausa accesible y error de PDF recuperable.
import { useEffect, useState } from 'react'
import type { useAvisoCreado } from '../hooks/useAvisoCreado'
import type { CompanyInfo, Order, Receipt } from '../types'
import { descargarPdfOrden } from '../utils/accionesPdf'
import { shareReceiptPdf } from '../utils/receiptPdf'
import './avisoCreado.css'
type Props = {
  control: ReturnType<typeof useAvisoCreado>
  registro: Order | Receipt | undefined
  companyInfo: CompanyInfo
  user: unknown
  onVer: () => void
}
const BOTON = 'min-h-11 min-w-11 rounded-lg px-3 text-sm font-medium '
  + 'focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50'
export default function AvisoCreado({ control, registro, companyInfo, user, onVer }: Props) {
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const { reanudar } = control
  useEffect(() => {
    const soltar = () => reanudar('tacto')
    // Escuchar fuera del aviso permite terminar un toque sin capturar clicks de botones.
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    return () => {
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  }, [reanudar])
  if (!control.aviso || !registro) return null
  const orden = control.aviso.tipo === 'orden'
  const subtitulo = orden ? (registro as Order).hotel || (registro as Order).service
    : `${(registro as Receipt).voucher} · ${(registro as Receipt).passenger}`
  async function pdf() {
    if (!registro) return
    setError('')
    setProcesando(true)
    const motivo = `pdf-${control.aviso?.id}`
    control.pausar(motivo)
    try {
      if (orden) await descargarPdfOrden(registro as Order, companyInfo, user)
      else await shareReceiptPdf(registro as Receipt, companyInfo, user)
    } catch {
      setError('No pudimos preparar el PDF. Inténtalo de nuevo.')
    } finally {
      setProcesando(false)
      control.reanudar(motivo)
    }
  }
  return <aside className="aviso-creado rounded-xl p-3 shadow-xl"
    onFocusCapture={() => control.pausar('foco')}
    onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) control.reanudar('foco')
    }}
    onPointerEnter={event => {
      if (event.pointerType !== 'touch') control.pausar('puntero')
    }}
    onPointerLeave={() => control.reanudar('puntero')}
    onPointerDown={() => control.pausar('tacto')}>
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1" role="status" aria-live="polite" aria-atomic="true">
        <p className="aviso-creado-titulo font-semibold">
          <span className="aviso-creado-icono">✓</span>{' '}
          {orden ? 'Orden creada' : 'Comprobante emitido'}
        </p>
        <p title={subtitulo} className="aviso-creado-subtitulo line-clamp-2 break-words text-sm">
          {subtitulo}
        </p>
      </div>
      <button type="button" className={`${BOTON} aviso-creado-cerrar`} aria-label="Cerrar aviso"
        onClick={control.cerrar}>×</button>
    </div>
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" className={`${BOTON} aviso-creado-ver`}
        onClick={onVer}>Ver</button>
      <button type="button" className={`${BOTON} aviso-creado-pdf`}
        disabled={procesando} onClick={() => void pdf()}>
        {procesando ? 'Preparando…' : 'PDF'}
      </button>
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </aside>
}
