// Fila accesible con confirmación local antes de suspender una cuenta.
import { useState } from 'react'
import type { UsuarioAdmin } from '../../hooks/useUsuariosAdmin'
export default function FilaUsuario({ usuario, propia, pendiente, onCambiar }: {
  usuario: UsuarioAdmin
  propia: boolean
  pendiente: boolean
  onCambiar: () => Promise<void>
}) {
  const [confirmar, setConfirmar] = useState(false)
  const activa = usuario.status === 'active'
  return <li
        className="min-w-0 rounded-xl border border-border bg-card p-4">
    <div
        className="flex items-center gap-3">
      <div
        className="min-w-0 flex-1">
        <p
        className="font-semibold break-words text-foreground">{usuario.username}</p>
        <p
        className="text-sm break-words text-muted-foreground">{usuario.phone || 'Sin teléfono'}</p>
        <span
        className="text-sm text-primary">{activa ? 'Activo' : 'Suspendido'}</span>
      </div>
      {propia ? <span
        className="text-sm font-medium">Tú</span> : <button
        type="button"
        role="switch"
        aria-checked={activa}
        aria-label={`${activa ? 'Suspender' : 'Activar'} a ${usuario.username}`}
        disabled={pendiente}
        onClick={() => activa ? setConfirmar(true) : void onCambiar()}
        className={`min-h-11 min-w-16 rounded-full p-2 focus-visible:ring-2
          focus-visible:ring-ring disabled:opacity-50 ${
            activa ? 'bg-primary' : 'bg-muted'}`}
      >
        <span
        className={`block h-6 w-6 rounded-full bg-card shadow ${
          activa ? 'ml-auto' : ''}`} />
      </button>}
    </div>
    {pendiente && <p
        role="status"
        className="mt-2 text-sm">Guardando estado…</p>}
    {confirmar && <div
        className="mt-3 text-sm space-y-3">
      <p
        className="break-words">¿Suspender a {usuario.username}? Ya no podrá iniciar sesión
        ni emitir comprobantes. Las órdenes de servicio sin sesión las sigue pudiendo usar.</p>
      <div
        className="flex flex-wrap gap-2">
        <button
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground
          focus-visible:ring-2 focus-visible:ring-ring"
        disabled={pendiente}
          onClick={() => { setConfirmar(false); void onCambiar() }}>Suspender</button>
        <button
        className="min-h-11 rounded-lg border px-4 focus-visible:ring-2
          focus-visible:ring-ring"
        onClick={() => setConfirmar(false)}>Cancelar</button>
      </div>
    </div>}
  </li>
}
