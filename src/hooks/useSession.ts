// Verifica la cookie y comunica suspensiones sin bloquear las órdenes públicas.
import { useCallback, useEffect, useState } from 'react'
export interface SessionUser {
  _id: string
  username: string
  role: string
  phone?: string
  avatar?: string
}
export const AVISO_SUSPENSION = 'Tu cuenta está suspendida. Contacta al administrador.'
export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [suspendida, setSuspendida] = useState(false)
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/verify`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.status === 403 && data.code === 'INACTIVE') setSuspendida(true)
      if (res.ok) setSuspendida(false)
      setUser(res.ok ? data.user : null)
    } catch {
      setUser(null)
    }
  }, [])
  useEffect(() => {
    void checkAuth()
    // Revalidar al volver a la app permite detectar una suspensión de otra sesión.
    const revisar = () => { void checkAuth() }
    window.addEventListener('focus', revisar)
    const timer = window.setInterval(revisar, 60000)
    return () => {
      window.removeEventListener('focus', revisar)
      window.clearInterval(timer)
    }
  }, [checkAuth])
  async function logout() {
    try {
      await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/logout`, {
        method: 'POST', credentials: 'include',
      })
    } catch {
      // Cerrar la sesión local también permite salir cuando no hay conexión.
    } finally {
      setUser(null)
    }
  }
  return { user, suspendida, checkAuth, logout }
}
