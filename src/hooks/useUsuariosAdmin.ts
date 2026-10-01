// Consulta usuarios y revierte cambios optimistas cuando el servidor rechaza el estado.
import { useCallback, useEffect, useState } from 'react'
export interface UsuarioAdmin {
  _id: string
  username: string
  phone: string
  role: string
  status: 'active' | 'inactive'
  createdAt: string
  avatar?: string
}
const base = import.meta.env.VITE_API_URL ?? ''
export function useUsuariosAdmin(onSesionCambio: () => Promise<void>) {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [pendientes, setPendientes] = useState<string[]>([])
  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const res = await fetch(`${base}/api/admin/users`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) await onSesionCambio()
        throw new Error(data.message || 'No pudimos cargar los usuarios.')
      }
      setUsuarios(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión.')
    } finally {
      setCargando(false)
    }
  }, [onSesionCambio])
  useEffect(() => { void cargar() }, [cargar])
  async function cambiarEstado(usuario: UsuarioAdmin) {
    const status = usuario.status === 'active' ? 'inactive' : 'active'
    setError('')
    setPendientes(prev => [...prev, usuario._id])
    setUsuarios(prev => prev.map(u => u._id === usuario._id ? { ...u, status } : u))
    try {
      const res = await fetch(`${base}/api/admin/users/${encodeURIComponent(usuario._id)}/status`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) await onSesionCambio()
        throw new Error(res.status === 409
          ? 'No puedes suspender tu propia cuenta.'
          : data.message || 'No pudimos cambiar el estado.')
      }
      setUsuarios(prev => prev.map(u => u._id === usuario._id ? data : u))
    } catch (err) {
      // Restaurar solamente esta fila evita deshacer cambios concurrentes de otras cuentas.
      setUsuarios(prev => prev.map(u => u._id === usuario._id ? usuario : u))
      setError(err instanceof Error ? err.message : 'Error de conexión.')
    } finally {
      setPendientes(prev => prev.filter(id => id !== usuario._id))
    }
  }
  return { usuarios, cargando, error, pendientes, reintentar: cargar, cambiarEstado }
}
