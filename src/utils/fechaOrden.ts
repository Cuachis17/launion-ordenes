// Conversión de fechas de órdenes históricas entre su presentación y el input ISO.
// Helper para mostrar fecha en formato 'DD - nombre de mes - YYYY'
export function formatDateDisplay(iso?: string) {
    if (!iso) return ''
    try {
      const d = new Date(iso + 'T00:00:00')
      const day = String(d.getDate()).padStart(2, '0')
      const month = d.toLocaleString('es-ES', { month: 'long' })
      const year = d.getFullYear()
      return `${day} - ${month} - ${year}`
    } catch {
      return iso
    }
  }

// Parse formatted 'DD - month - YYYY' or ISO 'YYYY-MM-DD' into ISO 'YYYY-MM-DD'
export function parseToIso(s?: string) {
    if (!s) return ''
  // already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // try to parse patterns like '16 - febrero - 2026' or '16 - febrero - 2026'
    const parts = s.split('-').map(p => p.trim())
    if (parts.length === 3) {
      const [dayStr, monthStr, yearStr] = parts
      const day = parseInt(dayStr, 10)
      const year = parseInt(yearStr, 10)
      if (!isNaN(day) && !isNaN(year)) {
      // map spanish month names to month index
        const months = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
        ]
        const monthIndex = months.findIndex(m => m.toLowerCase() === monthStr.toLowerCase())
        if (monthIndex >= 0) {
          const mm = String(monthIndex + 1).padStart(2,'0')
          const dd = String(day).padStart(2,'0')
          return `${year}-${mm}-${dd}`
        }
      }
    }
  // fallback: try Date parse
    const parsed = new Date(s)
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear()
      const m = String(parsed.getMonth()+1).padStart(2,'0')
      const d = String(parsed.getDate()).padStart(2,'0')
      return `${y}-${m}-${d}`
    }
    return ''
  }
