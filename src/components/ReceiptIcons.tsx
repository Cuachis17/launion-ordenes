// Iconos SVG del historial de comprobantes restaurados de la versión de referencia.
type IconProps = {
  className?: string
}

export function IconDownload({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export function IconTrash({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1-2-2h2a2 2 0 0 1-2 2v2" />
    </svg>
  )
}

export function IconEdit({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function IconDuplicate({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export function IconSearch({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg width="16" height="16" className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function IconReceipt({ className = 'w-12 h-12' }: IconProps) {
  return (
    <svg width="48" height="48" className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden>
      <path
        d={
          'M4 2v20l2.5-1.5L9 22l2.5-1.5L14 22l2.5-1.5L19 22V2'
          + 'l-2.5 1.5L14 2l-2.5 1.5L9 2 6.5 3.5 4 2z'
        }
      />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  )
}

export function IconShare({ className = '' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"
      strokeWidth="1.9" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 3v13m0-13l-4 4m4-4l4 4M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" />
    </svg>
  )
}
