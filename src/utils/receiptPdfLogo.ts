/**
 * @fileoverview Recupera el avatar de sesion para el PDF con fallo tolerante.
 * Convierte avatares WebP a PNG para evitar perdida de canal alfa en jsPDF.
 */

import { imagenPngParaPdf } from './pdfTexto'

interface UsuarioConAvatar {
  id?: string | number
  avatar?: string | boolean | null
}

// El comprobante lo lee el pasajero, muchas veces con prisa en el lobby de un
// hotel y desde el movil. Por eso la jerarquia es agresiva: lo que necesita ver
// de lejos va grande, y lo legal va en letra chica al pie.
// El logo principal es el del usuario, que vive en su sesion del servidor
// (el mismo avatar que muestra el header). Si falla se usa el de La Union.
export async function logoDelUsuario(user: unknown): Promise<string | null> {
  const u = user as UsuarioConAvatar | undefined
  const api = import.meta.env.VITE_API_URL ?? ''
  if (!u?.id || !u?.avatar) {
    return null
  }
  try {
    const res = await fetch(`${api}/api/users/${u.id}/avatar`, { credentials: 'include' })
    if (!res.ok) {
      return null
    }
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) {
      return null
    }
    const rawDataUrl = await new Promise<string | null>((resolver) => {
      const lector = new FileReader()
      lector.onloadend = () => resolver(typeof lector.result === 'string' ? lector.result : null)
      lector.onerror = () => resolver(null)
      lector.readAsDataURL(blob)
    })
    if (!rawDataUrl) {
      return null
    }
    // jsPDF no soporta WebP: con addImage sobre un data URI webp lo rasteriza a JPEG
    // y el fondo transparente se vuelve negro. Convertimos a PNG para preservar el alfa.
    return await imagenPngParaPdf(rawDataUrl)
  } catch {
    return null
  }
}

