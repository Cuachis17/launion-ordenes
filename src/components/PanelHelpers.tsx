// Estados de sesión y pestañas móviles de los paneles.
// Un comprobante de venta debe poder atribuirse a quien lo emitió, y su logo
// sale del perfil de esa sesión. Sin usuario no se captura.
export function SesionRequerida({ onIniciar }: { onIniciar: () => void }) {
  return (
    <div
        className="py-10 flex flex-col items-center text-center">
      <div
        className="w-12 h-12 rounded-full bg-muted grid place-items-center mb-4">
        <svg
        className="w-6 h-6 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="1.7">
          <path
        strokeLinecap="round"
        strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0
002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <p
        className="text-foreground font-semibold">Inicia sesión para emitir comprobantes</p>
      <p
        className="text-sm text-muted-foreground mt-1 max-w-xs">
        El comprobante lleva tu logo y queda a nombre de quien lo emite,
        así que necesita una sesión activa.
      </p>
      <button
        onClick={onIniciar}
        className="mt-5 px-5 h-11 rounded-lg bg-primary text-primary-foreground
font-medium hover:bg-primary/90 transition-colors"
      >
        Iniciar sesión
      </button>
    </div>
  )
}

// En teléfono no caben formulario y lista a la vez: se alternan con estas
// pestañas. Desde lg los dos paneles se ven juntos y las pestañas desaparecen.
export function PestanasMovil({
  valor, onCambiar, etiquetas,
}: {
  valor: 'form' | 'lista'
  onCambiar: (v: 'form' | 'lista') => void
  etiquetas: [string, string]
}) {
  const opciones: Array<'form' | 'lista'> = ['form', 'lista']
  return (
    <div
        className="lg:hidden mb-2 grid grid-cols-2 gap-1 p-1 rounded-xl bg-card/70
border border-border shadow-sm">
      {opciones.map((op, i) => (
        <button
          key={op}
          onClick={() => onCambiar(op)}
          aria-current={valor === op ? 'page' : undefined}
          className={`h-9 rounded-lg text-sm font-medium
                    transition-colors ${
            valor === op ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {etiquetas[i]}
        </button>
      ))}
    </div>
  )
}
