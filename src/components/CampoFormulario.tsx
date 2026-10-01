// Campo accesible compartido; asocia el error y permite encoger dentro de grids móviles.
import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label: string
  error?: string
  onChange: (value: string) => void
}

export default function CampoFormulario({
  label, error, onChange, className = '', ...props
}: Props) {
  const id = useId()
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <input {...props} id={id} aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full min-w-0 rounded-lg border border-border bg-input-background
          px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-ring
          ${className}`.trim()} />
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  )
}
