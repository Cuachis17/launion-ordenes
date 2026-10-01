/**
 * @fileoverview Utilidades de normalizacion WinAnsi y renderizado delimitado para jsPDF.
 * Previene caracteres corruptos por emojis o caracteres incompatibles y evita
 * empalmes o desbordamientos calculando con precision saltos de linea y alturas.
 */

import type { jsPDF } from 'jspdf'

export interface OpcionesTextoEnCaja {
  maxLineas?: number
  interlineado?: number
  align?: 'left' | 'center' | 'right'
}

/**
 * Normaliza una cadena para garantizar compatibilidad con WinAnsi (Windows-1252).
 * Preserva acentos en espanol, enes, signos de apertura (Â¿, Â¡) y comillas/guiones ASCII,
 * transformando variantes tipograficas y eliminando emojis y caracteres no soportados
 * que de otro modo provocarian caracteres faltantes o corruptos al renderizar.
 */
export function textoSeguro(s: unknown): string {
  if (s === null || s === undefined) {
    return ''
  }
  let t = String(s).normalize('NFC')
  // Reemplazar espacios de no separacion o de ancho fijo por espacio estandar
  t = t.replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
  // Convertir comillas tipograficas dobles y simples a sus equivalentes ASCII
  t = t.replace(/[“”„«»‟]/g, '"')
  t = t.replace(/[‘’‚‹›‛′]/g, "'")
  // Convertir guiones y barras tipograficas a guion simple
  t = t.replace(/[–—―−]/g, '-')
  // Filtrar caracteres incompatibles con fuentes standard WinAnsi en jsPDF.
  // Mantiene ASCII imprimible, saltos de linea, suplemento Latin-1, elipsis y bullet.
  t = t.replace(/[^\x20-\x7E\n\r\t\u00A0-\u00FF\u2026\u2022]/gu, '')
  // Los símbolos eliminados dejan huecos; no se juntan líneas del texto original.
  return t.replace(/[ \t]{2,}/g, ' ')
}

/**
 * Renderiza texto envuelto dentro de un ancho maximo especificado,
 * limitando el numero de lineas si se indica y anadiendo elipsis ("…").
 * Devuelve la altura total ocupada por el bloque renderizado en puntos.
 */
export function textoEnCaja(
  doc: jsPDF,
  texto: unknown,
  x: number,
  y: number,
  ancho: number,
  opciones?: OpcionesTextoEnCaja,
): number {
  const limpio = textoSeguro(texto)
  if (!limpio.trim() || ancho <= 0) {
    return 0
  }

  const fontSize = doc.getFontSize()
  const lineHeight = opciones?.interlineado ?? Math.round(fontSize * 1.25)
  let lineas: string[] = doc.splitTextToSize(limpio, ancho)

  if (opciones?.maxLineas && lineas.length > opciones.maxLineas) {
    const limite = opciones.maxLineas
    let ultima = lineas[limite - 1].trimEnd()
    while (ultima.length > 0 && doc.getTextWidth(`${ultima}…`) > ancho) {
      ultima = ultima.slice(0, -1).trimEnd()
    }
    lineas = lineas.slice(0, limite)
    lineas[limite - 1] = ultima ? `${ultima}…` : '…'
  }

  const align = opciones?.align ?? 'left'
  for (let i = 0; i < lineas.length; i++) {
    doc.text(lineas[i], x, y + i * lineHeight, { align })
  }

  return lineas.length * lineHeight
}

/**
 * Convierte cualquier imagen o URL a Data URL PNG manteniendo el canal alfa.
 * jsPDF no soporta WebP: al recibir un HTMLImageElement o data URI webp lo
 * rasteriza internamente en canvas auxiliar a JPEG, convirtiendo la transparencia
 * en fondo negro. Redibujar en canvas 2D limitado a 512px y exportar como PNG
 * conserva el canal alfa intacto sin inflar el tamano del PDF.
 */
export async function imagenPngParaPdf(
  src: string | HTMLImageElement,
): Promise<string | null> {
  if (!src) {
    return null
  }
  try {
    let img: HTMLImageElement
    if (typeof src === 'string') {
      img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = src
    } else {
      img = src
    }
    if (!img.complete) {
      const ok = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
      })
      if (!ok) {
        return null
      }
    }

    const nw = img.naturalWidth || img.width
    const nh = img.naturalHeight || img.height
    if (!nw || !nh) {
      return null
    }

    const maxLado = 512
    let w = nw
    let h = nh
    if (w > maxLado || h > maxLado) {
      if (w >= h) {
        h = Math.round((h * maxLado) / w)
        w = maxLado
      } else {
        w = Math.round((w * maxLado) / h)
        h = maxLado
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return null
    }
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

/**
 * Carga una imagen asincronamente para ser incrustada en jsPDF convertida a PNG.
 * Retorna null si la URL es indefinida o si la conversion/carga falla.
 */
export async function cargarImagenPdf(
  url: string | undefined,
): Promise<HTMLImageElement | null> {
  if (!url) {
    return null
  }
  const pngData = await imagenPngParaPdf(url)
  if (!pngData) {
    return null
  }
  return new Promise((resolver) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolver(img)
    img.onerror = () => resolver(null)
    img.src = pngData
  })
}

/**
 * Dibuja un logo escalado proporcionalmente a una altura fija en jsPDF.
 */
export function ponerLogoPdf(
  doc: jsPDF,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  alto: number,
): void {
  if (!img) {
    return
  }
  try {
    const ancho = (img.width * alto) / img.height
    doc.addImage(img, 'PNG', x, y, ancho, alto)
  } catch {
    // Falla silenciosa si la imagen esta corrupta o no es compatible
  }
}
