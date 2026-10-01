// Administración móvil de cuentas con búsqueda, reintento y conteos globales.
import { useState } from 'react'
import { useUsuariosAdmin } from '../../hooks/useUsuariosAdmin'
import FilaUsuario from './FilaUsuario'
export default function PanelUsuarios({ usuarioId, onSesionCambio }: {
  usuarioId: string
  onSesionCambio: () => Promise<void>
}) {
  const [busqueda, setBusqueda] = useState('')
  const { usuarios, cargando, error, pendientes, reintentar, cambiarEstado } =
    useUsuariosAdmin(onSesionCambio)
  const filtro = busqueda.trim().toLocaleLowerCase()
  const visibles = usuarios.filter(u =>
    `${u.username} ${u.phone}`.toLocaleLowerCase().includes(filtro))
  const activos = usuarios.filter(u => u.status === 'active').length
  return <main
        className="mx-auto max-w-3xl min-w-0 p-3 sm:p-6">
    <h1
        className="text-xl font-semibold text-foreground">Usuarios</h1>
    <p
        className="mt-1 text-sm text-muted-foreground">
      {activos} activos · {usuarios.length - activos} suspendidos
    </p>
    <label htmlFor="buscar-usuarios"
        className="block mt-4 mb-1 text-sm font-medium">
      Buscar por nombre o teléfono
    </label>
    <input id="buscar-usuarios" type="search" value={busqueda}
      onChange={e => setBusqueda(e.target.value)}
      className="w-full min-w-0 min-h-11 rounded-lg border border-border bg-card px-3
        focus-visible:ring-2 focus-visible:ring-ring" />
    {error && <div
        role="alert"
        className="mt-4 rounded-lg bg-card p-4">
      <p>{error}</p>
      <button
        onClick={() => void reintentar()}
        className="min-h-11 underline
        focus-visible:ring-2 focus-visible:ring-ring">Reintentar</button>
    </div>}
    {cargando ? <p
        role="status"
        className="mt-4">Cargando usuarios…</p> :
      visibles.length === 0 ? <p
        className="mt-4">No hay usuarios que coincidan con tu búsqueda.</p> :
      <ul
        className="mt-4 space-y-3">
        {visibles.map(usuario => <FilaUsuario key={usuario._id} usuario={usuario}
          propia={usuario._id === usuarioId}
        pendiente={pendientes.includes(usuario._id)}
          onCambiar={() => cambiarEstado(usuario)} />)}
      </ul>}
  </main>
}
