// Catálogo de aplicaciones y sus identificadores.
import type { ReactNode } from 'react'
export type AppId = 'ordenes' | 'comprobantes' | 'cotizador' | 'usuarios'

// La lista está pensada para crecer: añadir una app es añadir un objeto aquí.
export const APPS: { id: AppId; nombre: string; descripcion: string; icono: ReactNode }[] = [
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    descripcion: 'Activar o suspender cuentas',
    icono: <span aria-hidden="true">♙</span>,
  },
  {
    id: 'ordenes',
    nombre: 'Órdenes de servicio',
    descripcion: 'Reservas y vouchers de transportación',
    icono: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="1.8">
        <path
        strokeLinecap="round"
        strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0
00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012
2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'comprobantes',
    nombre: 'Comprobantes de venta',
    descripcion: 'Recibos para el pasajero',
    icono: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="1.8">
        <path
        strokeLinecap="round"
        strokeLinejoin="round" d="M9 14h6m-6-4h6m-8 9l1.5-1.5L10 19l1.5-1.5L13 19l1.5-1.5L16
19l1.5-1.5L19 19V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14z" />
      </svg>
    ),
  },
  {
    id: 'cotizador',
    nombre: 'Cotizador de traslados',
    descripcion: 'Tarifas de rutas, tours y extras',
    icono: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="1.8">
        <path
        strokeLinecap="round"
        strokeLinejoin="round" d="M4 19h16M6 16V8m6 8V5m6 11v-6M4 5h16" />
      </svg>
    ),
  },
]
