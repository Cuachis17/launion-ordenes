// Navegación local que descarta Usuarios al perder el permiso de administrador.
import { useState } from 'react'
import type { AppId } from '../components/apps'
export function useAppNavigation(role?: string) {
  const [appActiva, setAppActiva] = useState<AppId>('ordenes')
  const [panelMovil, setPanelMovil] = useState<'form' | 'lista'>('form')
  // Ajustar durante el render evita mostrar un panel restringido en el siguiente frame.
  if (appActiva === 'usuarios' && role !== 'admin') setAppActiva('ordenes')
  function elegir(id: AppId) {
    setAppActiva(id)
    setPanelMovil('form')
  }
  return { appActiva, elegir, panelMovil, setPanelMovil }
}
